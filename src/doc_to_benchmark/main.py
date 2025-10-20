from __future__ import annotations

from pathlib import Path

import asyncio
import contextlib
from typing import Optional

from anyio import create_memory_object_stream
from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api import router
from .database import build_database_url, create_engine, create_sessionmaker, initialize_database
from .storage import UploadStorage
from .services.events import SseBroker
from .services.worker import OcrBackgroundWorker, OcrTask

STATIC_DIR = Path(__file__).parent / "static"


class SPAStaticFiles(StaticFiles):
    """Serve the React build and fall back to index.html for history navigation."""

    async def get_response(self, path: str, scope):  # type: ignore[override]
        response = await super().get_response(path, scope)
        if response.status_code == 404:
            index_path = Path(self.directory) / "index.html"
            if index_path.exists():
                return FileResponse(index_path)
        return response


def create_app() -> FastAPI:
    app = FastAPI(title="PyPI Upload Demo", version="0.1.4")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    storage = UploadStorage()
    app.state.storage = storage

    database_url = build_database_url(storage.base_directory.parent)
    engine = create_engine(database_url)
    session_factory = create_sessionmaker(engine)
    app.state.db_engine = engine
    app.state.db_sessionmaker = session_factory
    app.state.sse_broker = SseBroker()

    task_sender: MemoryObjectSendStream[OcrTask]
    task_receiver: MemoryObjectReceiveStream[OcrTask]
    task_sender, task_receiver = create_memory_object_stream(max_buffer_size=32)
    app.state.ocr_task_sender = task_sender
    app.state._ocr_task_receiver = task_receiver
    app.state._ocr_worker_task: Optional[asyncio.Task[None]] = None

    @app.on_event("startup")
    async def _startup() -> None:
        await storage.ensure_ready()
        await initialize_database(engine)

        worker = OcrBackgroundWorker(
            tasks=app.state._ocr_task_receiver,
            session_factory=session_factory,
            storage=storage,
            broker=app.state.sse_broker,
        )
        app.state._ocr_worker_task = asyncio.create_task(worker.run())

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        if app.state._ocr_worker_task:
            app.state._ocr_worker_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await app.state._ocr_worker_task
        await app.state.ocr_task_sender.aclose()
        await engine.dispose()

    app.include_router(router, prefix="/api", tags=["documents"])

    if STATIC_DIR.exists():
        app.mount("/", SPAStaticFiles(directory=STATIC_DIR, html=True), name="spa")

    return app


app = create_app()

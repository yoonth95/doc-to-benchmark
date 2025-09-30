from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api import router
from .storage import UploadStorage

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
    app = FastAPI(title="PyPI Upload Demo", version="0.1.1")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    storage = UploadStorage()
    app.state.storage = storage

    @app.on_event("startup")
    async def _ensure_storage() -> None:
        await storage.ensure_ready()

    app.include_router(router, prefix="/api", tags=["uploads"])

    if STATIC_DIR.exists():
        app.mount("/", SPAStaticFiles(directory=STATIC_DIR, html=True), name="spa")

    return app


app = create_app()

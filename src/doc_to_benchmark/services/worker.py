from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from anyio.abc import ObjectReceiveStream
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..models import Document, DocumentStatus
from ..ocr_pipeline import process_document
from ..storage import UploadStorage
from .events import SseBroker, SseEvent
from .progress import OcrProgressReporter
from .status import document_status_to_stream_label


@dataclass(slots=True)
class OcrTask:
    document_id: str
    stored_name: str
    api_key: Optional[str]


class OcrBackgroundWorker:
    """Consume OCR tasks and execute the LangGraph pipeline in the background."""

    def __init__(
        self,
        *,
        tasks: ObjectReceiveStream[OcrTask],
        session_factory: async_sessionmaker[AsyncSession],
        storage: UploadStorage,
        broker: SseBroker,
    ) -> None:
        self._tasks = tasks
        self._session_factory = session_factory
        self._storage = storage
        self._broker = broker

    async def run(self) -> None:
        """Continuously process OCR tasks until the receive stream closes."""
        async with self._tasks:
            async for task in self._tasks:
                await self._handle_task(task)

    async def _handle_task(self, task: OcrTask) -> None:
        async with self._session_factory() as session:
            document = await session.get(Document, task.document_id)
            if document is None:
                await self._broker.publish(
                    SseEvent(
                        event="document-status",
                        data={
                            "documentId": task.document_id,
                            "status": "error",
                            "message": "문서를 찾을 수 없습니다.",
                        },
                    ),
                    document_id=task.document_id,
                )
                return

            progress = OcrProgressReporter(
                document_id=document.id,
                session_factory=self._session_factory,
                broker=self._broker,
            )
            await progress.initialize(document_status_to_stream_label(document.status))

            await self._start_processing(session, document)

            file_path = self._storage.base_directory / task.stored_name
            try:
                await process_document(
                    document=document,
                    file_path=file_path,
                    storage=self._storage,
                    session=session,
                    api_key=task.api_key,
                    progress=progress,
                )
                await session.commit()
                await session.refresh(document)
                await progress.finalize(document_status_to_stream_label(document.status))
                await self._publish_status(document)
            except Exception as exc:  # noqa: BLE001
                await session.rollback()
                document = await session.get(Document, task.document_id)
                if document is None:
                    await self._broker.publish(
                        SseEvent(
                            event="document-status",
                            data={
                                "documentId": task.document_id,
                                "status": "error",
                                "message": str(exc),
                            },
                        ),
                        document_id=task.document_id,
                    )
                    return

                document.status = DocumentStatus.FAILED
                document.selection_rationale = f"OCR 처리 실패: {exc}"
                document.processed_at = datetime.utcnow()
                document.recommended_strategy = None
                document.recommendation_notes = None
                document.selected_strategy = None
                document.quality_score = None
                document.ocr_speed_ms_per_page = None
                await session.commit()
                await session.refresh(document)
                await progress.finalize("error")
                await self._publish_status(document, message=str(exc))

    async def _start_processing(self, session: AsyncSession, document: Document) -> None:
        if document.status != DocumentStatus.PROCESSING:
            document.status = DocumentStatus.PROCESSING
            await session.commit()
            await session.refresh(document)
        await self._publish_status(document)

    async def _publish_status(self, document: Document, *, message: str | None = None) -> None:
        await self._broker.publish(
            SseEvent(
                event="document-status",
                data={
                    "documentId": document.id,
                    "status": document_status_to_stream_label(document.status),
                    "uploadedAt": document.uploaded_at,
                    "processedAt": document.processed_at,
                    "pagesCount": document.pages_count,
                    "recommendedStrategy": document.recommended_strategy,
                    "message": message,
                },
            ),
            document_id=document.id,
        )

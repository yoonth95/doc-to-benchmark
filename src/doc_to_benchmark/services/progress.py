from __future__ import annotations

import asyncio
from typing import Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..models import AgentStatus, Document, ReportAgentStatus
from .events import SseBroker, SseEvent

STAGE_ORDER = ["uploaded", "extraction", "validation", "judge", "report"]
STAGE_TO_NODES = {
    "uploaded": ["n1"],
    "extraction": ["n2", "n3", "n4", "n5", "n6"],
    "validation": ["n7"],
    "judge": ["n8"],
    "report": ["n9"],
}


def _build_mermaid_chart(stage_states: Dict[str, str]) -> str:
    """Render a mermaid chart that highlights stage progression."""
    lines = [
        "flowchart TD",
        "  n1([Document Upload]):::base",
        "  n2([Format Detection]):::base",
        "  n3{Layout Analysis}:::base",
        "  n4([Single Page]):::base",
        "  n5([Dual Page Detected]):::base",
        "  n6([Page Splitting]):::base",
        "  n7([OCR Processing]):::base",
        "  n8([Quality Check]):::base",
        "  n9([Output Generation]):::base",
        "  n1 --> n2",
        "  n2 --> n3",
        "  n3 -- 단일 페이지 --> n4",
        "  n3 -- 가로 2면 --> n5",
        "  n4 --> n7",
        "  n5 --> n6",
        "  n6 --> n7",
        "  n7 --> n8",
        "  n8 --> n9",
        "  classDef base fill:#f5f5f5,stroke:#bdbdbd,stroke-width:1px,color:#212121;",
        "  classDef pending fill:#e0e0e0,stroke:#bdbdbd,color:#616161;",
        "  classDef running fill:#e3f2fd,stroke:#64b5f6,color:#0d47a1;",
        "  classDef completed fill:#e8f5e9,stroke:#81c784,color:#1b5e20;",
        "  classDef failed fill:#ffebee,stroke:#ef5350,color:#b71c1c;",
    ]
    for stage, nodes in STAGE_TO_NODES.items():
        status = stage_states.get(stage, "pending")
        css = "pending"
        if status in ("running", "completed", "failed"):
            css = status
        for node in nodes:
            lines.append(f"  class {node} {css};")
    return "\n".join(lines)


class OcrProgressReporter:
    """Coordinate OCR progress updates across SSE and database."""

    def __init__(
        self,
        *,
        document_id: str,
        session_factory: async_sessionmaker[AsyncSession],
        broker: SseBroker,
    ) -> None:
        self._document_id = document_id
        self._session_factory = session_factory
        self._broker = broker
        self._stage_states: Dict[str, str] = {stage: "pending" for stage in STAGE_ORDER}
        self._lock = asyncio.Lock()
        self._mermaid_chart: str | None = None

    async def initialize(self, initial_status: str) -> None:
        self._stage_states["uploaded"] = "completed" if initial_status != "uploaded" else "running"
        await self._persist_mermaid()
        await self._publish_progress()

    async def stage_started(self, stage: str) -> None:
        async with self._lock:
            self._stage_states.setdefault(stage, "pending")
            self._stage_states[stage] = "running"
            if stage != "uploaded" and self._stage_states.get("uploaded") == "running":
                self._stage_states["uploaded"] = "completed"
            await self._update_agent_status(stage, AgentStatus.RUNNING)
            await self._persist_mermaid()
            await self._publish_progress()

    async def stage_completed(self, stage: str, *, description: Optional[str] = None) -> None:
        async with self._lock:
            self._stage_states[stage] = "completed"
            await self._update_agent_status(stage, AgentStatus.COMPLETED, description=description)
            await self._persist_mermaid()
            await self._publish_progress()

    async def stage_failed(self, stage: str, *, error: str) -> None:
        async with self._lock:
            self._stage_states[stage] = "failed"
            await self._update_agent_status(stage, AgentStatus.FAILED, description=error)
            await self._persist_mermaid()
            await self._publish_progress()

    async def finalize(self, document_status: str) -> None:
        async with self._lock:
            if document_status == "completed":
                self._stage_states["report"] = "completed"
            elif document_status == "error":
                self._stage_states["report"] = "failed"
            await self._persist_mermaid()
            await self._publish_progress()

    async def _update_agent_status(
        self,
        stage: str,
        agent_status: AgentStatus,
        *,
        description: Optional[str] = None,
    ) -> None:
        async with self._session_factory() as session:
            record = await session.scalar(
                select(ReportAgentStatus).where(
                    ReportAgentStatus.document_id == self._document_id,
                    ReportAgentStatus.agent_name == stage,
                )
            )
            if record is None:
                record = ReportAgentStatus(
                    document_id=self._document_id,
                    agent_name=stage,
                    status=agent_status,
                    description=description,
                )
                session.add(record)
            else:
                record.status = agent_status
                record.description = description
            await session.commit()

    async def _persist_mermaid(self) -> None:
        chart = _build_mermaid_chart(self._stage_states)
        self._mermaid_chart = chart
        async with self._session_factory() as session:
            document = await session.get(Document, self._document_id)
            if document is None:
                return
            document.mermaid_chart = chart
            await session.commit()

    async def _collect_agent_payload(self) -> list[dict]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(ReportAgentStatus).where(ReportAgentStatus.document_id == self._document_id)
            )
            statuses = []
            for record in result.scalars().all():
                statuses.append(
                    {
                        "agent": record.agent_name,
                        "status": record.status.value,
                        "description": record.description,
                    }
                )
            return statuses

    async def _publish_progress(self) -> None:
        payload = {
            "documentId": self._document_id,
            "stages": self._stage_states,
            "agents": await self._collect_agent_payload(),
            "mermaid": self._mermaid_chart,
        }
        await self._broker.publish(
            SseEvent(event="document-progress", data=payload),
            document_id=self._document_id,
        )

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import Any, AsyncIterator, Dict, Optional, Set


def _json_dumps(data: Dict[str, Any]) -> str:
    """Serialize payloads to JSON using ISO timestamps where possible."""

    def default_serializer(obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"type {type(obj)!r} is not JSON serializable")

    return json.dumps(data, default=default_serializer)


@dataclass(slots=True)
class SseEvent:
    """Normalized SSE event structure."""

    event: str
    data: Dict[str, Any]

    def as_message(self) -> Dict[str, str]:
        """Return a dict compatible with Starlette's EventSourceResponse."""
        return {"event": self.event, "data": _json_dumps(self.data)}


class SseBroker:
    """In-process pub/sub broker for SSE streaming."""

    def __init__(self, *, queue_size: int = 64) -> None:
        self._queue_size = queue_size
        self._all_subscribers: Set[asyncio.Queue[SseEvent]] = set()
        self._document_subscribers: Dict[str, Set[asyncio.Queue[SseEvent]]] = {}
        self._lock = asyncio.Lock()

    async def publish(self, event: SseEvent, *, document_id: Optional[str] = None) -> None:
        """Publish `event` to global listeners and optionally document-specific listeners."""

        async with self._lock:
            recipients: Set[asyncio.Queue[SseEvent]] = set(self._all_subscribers)
            if document_id is not None:
                recipients.update(self._document_subscribers.get(document_id, set()))

        await asyncio.gather(*(self._send(queue, event) for queue in recipients))

    async def subscribe_all(self) -> AsyncIterator[SseEvent]:
        """Subscribe to all document events."""
        queue = asyncio.Queue[SseEvent](maxsize=self._queue_size)
        async with self._register(queue, bucket=self._all_subscribers):
            while True:
                event = await queue.get()
                yield event

    async def subscribe_document(self, document_id: str) -> AsyncIterator[SseEvent]:
        """Subscribe to events for a single document."""

        queue = asyncio.Queue[SseEvent](maxsize=self._queue_size)
        async with self._register(queue, bucket=self._document_bucket(document_id)):
            while True:
                event = await queue.get()
                yield event

    async def _send(self, queue: asyncio.Queue[SseEvent], event: SseEvent) -> None:
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
            queue.put_nowait(event)

    @asynccontextmanager
    async def _register(
        self,
        queue: asyncio.Queue[SseEvent],
        *,
        bucket: Set[asyncio.Queue[SseEvent]],
    ) -> AsyncIterator[None]:
        async with self._lock:
            bucket.add(queue)
        try:
            yield
        finally:
            async with self._lock:
                bucket.discard(queue)

    def _document_bucket(self, document_id: str) -> Set[asyncio.Queue[SseEvent]]:
        bucket = self._document_subscribers.get(document_id)
        if bucket is None:
            bucket = set()
            self._document_subscribers[document_id] = bucket
        return bucket

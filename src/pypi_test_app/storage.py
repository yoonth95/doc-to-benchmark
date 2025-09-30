from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List
from uuid import uuid4

from fastapi import UploadFile

from .schemas import UploadMetadata


class UploadStorage:
    """Stores uploaded files on disk alongside metadata in JSON."""

    def __init__(self, base_directory: Path | None = None) -> None:
        default_root = Path(os.getenv("PYPI_TEST_APP_STORAGE", Path.home() / ".pypi_test_app" / "uploads"))
        self.base_directory = base_directory or default_root
        self.metadata_path = self.base_directory / "metadata.json"
        self._lock = asyncio.Lock()

    async def ensure_ready(self) -> None:
        await asyncio.to_thread(self.base_directory.mkdir, parents=True, exist_ok=True)
        if not self.metadata_path.exists():
            await asyncio.to_thread(self.metadata_path.write_text, "[]", encoding="utf-8")

    async def list_uploads(self) -> List[UploadMetadata]:
        await self.ensure_ready()
        raw_items = await self._read_metadata()
        return [UploadMetadata.model_validate(item) for item in raw_items]

    async def save_files(self, files: Iterable[UploadFile]) -> List[UploadMetadata]:
        saved_items: List[UploadMetadata] = []
        for upload in files:
            metadata = await self._persist_file(upload)
            saved_items.append(metadata)
        async with self._lock:
            existing = await self._read_metadata()
            existing.extend(item.model_dump(mode="json") for item in saved_items)
            await self._write_metadata(existing)
        return saved_items

    async def _persist_file(self, upload: UploadFile) -> UploadMetadata:
        await self.ensure_ready()
        original_name = upload.filename or "unnamed"
        suffix = Path(original_name).suffix.lower()
        extension = suffix[1:] if suffix.startswith(".") else suffix
        stored_name = f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{uuid4().hex}{suffix}"
        destination = self.base_directory / stored_name

        size_bytes = await self._write_upload_file(destination, upload)

        metadata = UploadMetadata(
            id=str(uuid4()),
            original_name=original_name,
            stored_name=stored_name,
            size_bytes=size_bytes,
            extension=extension,
            uploaded_at=datetime.now(timezone.utc),
        )
        return metadata

    async def _write_upload_file(self, destination: Path, upload: UploadFile) -> int:
        async with self._lock:
            await asyncio.to_thread(destination.parent.mkdir, parents=True, exist_ok=True)
        data = await upload.read()
        size = len(data)
        await asyncio.to_thread(destination.write_bytes, data)
        await upload.close()
        return size

    async def _read_metadata(self) -> list[dict]:
        if not self.metadata_path.exists():
            return []
        content = await asyncio.to_thread(self.metadata_path.read_text, encoding="utf-8")
        try:
            data = json.loads(content) if content.strip() else []
        except json.JSONDecodeError:
            data = []
        return data

    async def _write_metadata(self, data: list[dict]) -> None:
        serialized = json.dumps(data, ensure_ascii=False, indent=2)
        await asyncio.to_thread(self.metadata_path.write_text, serialized, encoding="utf-8")

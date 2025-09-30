from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UploadMetadata(BaseModel):
    id: str
    original_name: str
    stored_name: str
    size_bytes: int
    extension: str
    uploaded_at: datetime

    model_config = ConfigDict(json_schema_extra={"example": {
        "id": "f3e3c8ec-4b0c-4a8b-96df-2ef2c4efbafe",
        "original_name": "report.pdf",
        "stored_name": "20250301094512_2d0983765c8c4bcbaa0fb640130beef3.pdf",
        "size_bytes": 102400,
        "extension": "pdf",
        "uploaded_at": "2025-03-01T09:45:12.124503+00:00",
    }})

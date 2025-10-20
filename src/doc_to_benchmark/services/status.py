from __future__ import annotations

from ..models import DocumentStatus


def document_status_to_stream_label(status: DocumentStatus) -> str:
    """Map persisted document statuses to SSE labels expected by the frontend."""
    mapping = {
        DocumentStatus.UPLOADED: "uploaded",
        DocumentStatus.PROCESSING: "ocr_processing",
        DocumentStatus.PROCESSED: "completed",
        DocumentStatus.FAILED: "error",
    }
    return mapping.get(status, status.value)

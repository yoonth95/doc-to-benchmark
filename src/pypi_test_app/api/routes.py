from __future__ import annotations

import asyncio
from io import BytesIO
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from urllib.parse import quote

from ..schemas import UploadMetadata
from ..storage import UploadStorage
from ..pdf_processing import process_pdf_bytes
from .dependencies import get_storage

router = APIRouter()


@router.get("/uploads", response_model=List[UploadMetadata])
async def list_uploads(storage: UploadStorage = Depends(get_storage)) -> List[UploadMetadata]:
    return await storage.list_uploads()


@router.post("/uploads", response_model=List[UploadMetadata], status_code=status.HTTP_201_CREATED)
async def upload_files(
    files: List[UploadFile] = File(..., description="One or more files to upload"),
    storage: UploadStorage = Depends(get_storage),
) -> List[UploadMetadata]:
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="최소 한 개의 파일을 업로드해야 합니다.")

    saved = await storage.save_files(files)
    return saved


@router.post("/uploads/pdf/process", response_class=StreamingResponse)
async def process_pdf(
    file: UploadFile = File(..., description="A PDF file with potential double-page spreads"),
    storage: UploadStorage = Depends(get_storage),
) -> StreamingResponse:
    filename = file.filename or "document.pdf"
    is_pdf_extension = filename.lower().endswith(".pdf")
    is_pdf_content = (file.content_type or "").lower() in {"application/pdf", "application/x-pdf", "application/acrobat"}
    if not (is_pdf_extension or is_pdf_content):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF 파일만 업로드할 수 있습니다.")

    data = await file.read()
    await file.close()

    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="빈 파일은 처리할 수 없습니다.")

    try:
        processed_bytes = await asyncio.to_thread(process_pdf_bytes, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="PDF 처리 중 오류가 발생했습니다.") from exc

    download_name = f"{Path(filename).stem}_processed.pdf"
    await storage.save_bytes(processed_bytes, original_name=download_name, extension="pdf")

    ascii_fallback = download_name.encode("ascii", "ignore").decode() or "processed.pdf"
    encoded_name = quote(download_name)
    content_disposition = (
        f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded_name}"
    )

    stream = BytesIO(processed_bytes)
    headers = {"Content-Disposition": content_disposition}
    return StreamingResponse(stream, media_type="application/pdf", headers=headers)

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..schemas import UploadMetadata
from ..storage import UploadStorage
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

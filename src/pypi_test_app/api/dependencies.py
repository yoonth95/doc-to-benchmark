from fastapi import Request

from ..storage import UploadStorage


def get_storage(request: Request) -> UploadStorage:
    return request.app.state.storage  # type: ignore[attr-defined]

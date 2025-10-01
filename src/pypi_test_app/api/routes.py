from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import AnalysisItem, Document, DocumentStatus, OcrProvider, OcrProviderEvaluation, ReportAgentStatus
from ..schemas import (
    AnalysisItemOut,
    AnalysisListResponse,
    DocumentInsightsResponse,
    DocumentListResponse,
    DocumentSummary,
    PagePreviewOut,
    ProviderEvaluationOut,
    ProviderSelectionRequest,
    ReportAgentStatusOut,
    UploadResponse,
)
from ..storage import UploadStorage
from .dependencies import get_session, get_storage

router = APIRouter()


_PROVIDER_DISPLAY_NAMES = {
    OcrProvider.GOOGLE_VISION: "Google Vision API",
    OcrProvider.AWS_TEXTRACT: "AWS Textract",
    OcrProvider.AZURE_DOCUMENT_INTELLIGENCE: "Azure Document Intelligence",
}


def _provider_display_name(provider: OcrProvider) -> str:
    return _PROVIDER_DISPLAY_NAMES.get(provider, provider.value.replace("_", " ").title())


def _build_document_summary(
    document: Document,
    *,
    analysis_items_count: int,
    recommended: OcrProvider | None = None,
    recommendation_reason: str | None = None,
) -> DocumentSummary:
    return DocumentSummary(
        id=document.id,
        original_name=document.original_name,
        stored_name=document.stored_name,
        size_bytes=document.size_bytes,
        extension=document.extension,
        language=document.language,
        status=document.status,
        uploaded_at=document.uploaded_at,
        processed_at=document.processed_at,
        confidence=document.confidence,
        pages_count=document.pages_count,
        analysis_items_count=analysis_items_count,
        recommended_provider=recommended if recommended is not None else document.recommended_provider,
        recommendation_reason=(
            recommendation_reason if recommendation_reason is not None else document.recommendation_reason
        ),
        selected_provider=document.selected_provider,
    )


def _calculate_recommendation(document: Document) -> tuple[OcrProvider | None, str | None]:
    if not document.provider_evaluations:
        return document.recommended_provider, document.recommendation_reason

    best_quality = max(document.provider_evaluations, key=lambda item: item.llm_judge_score, default=None)
    fastest = min(document.provider_evaluations, key=lambda item: item.time_per_page_ms, default=None)
    if best_quality is None or fastest is None:
        return document.recommended_provider, document.recommendation_reason

    # Score providers by combining normalised quality (higher is better) and latency (lower is better)
    max_score = best_quality.llm_judge_score
    min_score = min(item.llm_judge_score for item in document.provider_evaluations)
    max_time = max(item.time_per_page_ms for item in document.provider_evaluations)
    min_time = fastest.time_per_page_ms

    def _composite_value(entry: OcrProviderEvaluation) -> float:
        quality_range = max(max_score - min_score, 1e-6)
        time_range = max(max_time - min_time, 1e-6)
        quality_component = (entry.llm_judge_score - min_score) / quality_range
        speed_component = (max_time - entry.time_per_page_ms) / time_range
        # Weight quality slightly higher than speed to favour accuracy first
        return (0.6 * quality_component) + (0.4 * speed_component)

    ranked = sorted(document.provider_evaluations, key=_composite_value, reverse=True)
    top_entry = ranked[0]
    if document.recommended_provider and document.recommendation_reason:
        return document.recommended_provider, document.recommendation_reason

    reason = (
        f"{_provider_display_name(top_entry.provider)}가 LLM-Judge 점수 {top_entry.llm_judge_score:.1f}와"
        f" 페이지당 처리 시간 {top_entry.time_per_page_ms:.0f}ms로 가장 균형 잡힌 성능을 제공합니다."
    )
    return top_entry.provider, reason


def _build_provider_evaluations(document: Document) -> List[ProviderEvaluationOut]:
    if not document.provider_evaluations:
        return []

    max_quality = max(item.llm_judge_score for item in document.provider_evaluations)
    min_time = min(item.time_per_page_ms for item in document.provider_evaluations)
    total_pages = document.pages_count or len(document.pages)

    response: List[ProviderEvaluationOut] = []
    for entry in document.provider_evaluations:
        total_time_ms = entry.time_per_page_ms * total_pages
        response.append(
            ProviderEvaluationOut(
                provider=entry.provider,
                display_name=_provider_display_name(entry.provider),
                llm_judge_score=entry.llm_judge_score,
                time_per_page_ms=entry.time_per_page_ms,
                estimated_total_time_ms=total_time_ms,
                quality_notes=entry.quality_notes,
                latency_ms=entry.latency_ms,
                is_best_quality=entry.llm_judge_score == max_quality,
                is_fastest=entry.time_per_page_ms == min_time,
            )
        )
    return response


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(session: AsyncSession = Depends(get_session)) -> DocumentListResponse:
    stmt = (
        select(Document, func.count(AnalysisItem.id).label("analysis_items_count"))
        .outerjoin(AnalysisItem, AnalysisItem.document_id == Document.id)
        .group_by(Document.id)
        .order_by(Document.uploaded_at.desc())
    )
    result = await session.execute(stmt)
    items: List[DocumentSummary] = []
    for document, analysis_items_count in result.all():
        items.append(
            _build_document_summary(
                document,
                analysis_items_count=int(analysis_items_count or 0),
            )
        )
    return DocumentListResponse(items=items)


@router.get("/analysis-items", response_model=AnalysisListResponse)
async def list_analysis_items(session: AsyncSession = Depends(get_session)) -> AnalysisListResponse:
    stmt = (
        select(AnalysisItem, Document.original_name.label("document_name"))
        .join(Document, AnalysisItem.document_id == Document.id)
        .order_by(AnalysisItem.page_number.asc())
    )
    result = await session.execute(stmt)
    rows = result.all()
    items = [
        AnalysisItemOut(
            id=analysis.id,
            document_id=analysis.document_id,
            question=analysis.question,
            answer=analysis.answer,
            context_type=analysis.context_type,
            confidence=analysis.confidence,
            page_number=analysis.page_number,
            document_name=document_name,
        )
        for analysis, document_name in rows
    ]
    return AnalysisListResponse(items=items, total_items=len(items))


@router.get("/documents/{document_id}/insights", response_model=DocumentInsightsResponse)
async def get_document_insights(
    document_id: str,
    session: AsyncSession = Depends(get_session),
) -> DocumentInsightsResponse:
    document = await session.get(
        Document,
        document_id,
        options=[
            selectinload(Document.analysis_items),
            selectinload(Document.pages),
            selectinload(Document.provider_evaluations),
            selectinload(Document.report_agent_statuses),
        ],
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="문서를 찾을 수 없습니다.")

    recommended, reason = _calculate_recommendation(document)

    summary = _build_document_summary(
        document,
        analysis_items_count=len(document.analysis_items),
        recommended=recommended,
        recommendation_reason=reason,
    )

    provider_evaluations = _build_provider_evaluations(document)
    pages = [
        PagePreviewOut(page_number=page.page_number, image_path=page.image_path, text_content=page.text_content)
        for page in document.pages
    ]
    agent_statuses = [
        ReportAgentStatusOut(
            agent_name=item.agent_name,
            status=item.status,
            description=item.description,
        )
        for item in document.report_agent_statuses
    ]

    return DocumentInsightsResponse(
        document=summary,
        provider_evaluations=provider_evaluations,
        pages=pages,
        agent_statuses=agent_statuses,
        mermaid_chart=document.mermaid_chart,
        processing_summary=document.processing_summary,
    )


@router.put("/documents/{document_id}/selection", response_model=DocumentSummary)
async def update_document_selection(
    document_id: str,
    payload: ProviderSelectionRequest,
    session: AsyncSession = Depends(get_session),
) -> DocumentSummary:
    document = await session.get(
        Document,
        document_id,
        options=[selectinload(Document.analysis_items), selectinload(Document.provider_evaluations)],
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="문서를 찾을 수 없습니다.")

    if not any(entry.provider == payload.provider for entry in document.provider_evaluations):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="선택한 제공자가 문서 평가 데이터에 존재하지 않습니다.",
        )

    document.selected_provider = payload.provider
    await session.commit()

    recommended, reason = _calculate_recommendation(document)

    return _build_document_summary(
        document,
        analysis_items_count=len(document.analysis_items),
        recommended=recommended,
        recommendation_reason=reason,
    )


@router.post("/uploads", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    request: Request,
    file: UploadFile = File(..., description="업로드할 파일을 선택하세요."),
    storage: UploadStorage = Depends(get_storage),
    session: AsyncSession = Depends(get_session),
) -> UploadResponse:
    api_key = request.headers.get("x-ocr-api-key")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API 키가 필요합니다.")

    if file is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="최소 한 개의 파일을 업로드해야 합니다.")

    metadata_list = await storage.save_files([file])
    if not metadata_list:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="파일 저장에 실패했습니다.")

    metadata = metadata_list[0]
    document = Document(
        id=metadata.id,
        original_name=metadata.original_name,
        stored_name=metadata.stored_name,
        content_type=file.content_type,
        extension=metadata.extension,
        size_bytes=metadata.size_bytes,
        status=DocumentStatus.UPLOADED,
        uploaded_at=metadata.uploaded_at,
        pages_count=0,
    )
    session.add(document)
    await session.commit()

    summary = _build_document_summary(document, analysis_items_count=0)
    return UploadResponse(document=summary)


@router.get("/uploads", response_model=DocumentListResponse)
async def legacy_uploads(session: AsyncSession = Depends(get_session)) -> DocumentListResponse:
    return await list_documents(session)

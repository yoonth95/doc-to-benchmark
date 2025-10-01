from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from .models import AgentStatus, DocumentStatus, OcrProvider


class UploadMetadata(BaseModel):
    id: str
    original_name: str
    stored_name: str
    size_bytes: int
    extension: Optional[str]
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentSummary(BaseModel):
    id: str
    original_name: str
    stored_name: str
    size_bytes: int
    extension: Optional[str]
    language: Optional[str]
    status: DocumentStatus
    uploaded_at: datetime
    processed_at: Optional[datetime]
    confidence: Optional[float]
    pages_count: int
    analysis_items_count: int
    recommended_provider: Optional[OcrProvider]
    recommendation_reason: Optional[str]
    selected_provider: Optional[OcrProvider]

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    items: List[DocumentSummary]


class PagePreviewOut(BaseModel):
    page_number: int
    image_path: Optional[str]
    text_content: str

    model_config = ConfigDict(from_attributes=True)


class AnalysisItemOut(BaseModel):
    id: int
    document_id: str
    question: str
    answer: str
    context_type: str
    confidence: float
    page_number: int
    document_name: str

    model_config = ConfigDict(from_attributes=True)


class AnalysisListResponse(BaseModel):
    items: List[AnalysisItemOut]
    total_items: int

class ReportAgentStatusOut(BaseModel):
    agent_name: str
    status: AgentStatus
    description: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class UploadResponse(BaseModel):
    document: DocumentSummary


class ProviderEvaluationOut(BaseModel):
    provider: OcrProvider
    display_name: str
    llm_judge_score: float
    time_per_page_ms: float
    estimated_total_time_ms: float
    quality_notes: Optional[str]
    latency_ms: Optional[int]
    is_best_quality: bool
    is_fastest: bool


class DocumentInsightsResponse(BaseModel):
    document: DocumentSummary
    provider_evaluations: List[ProviderEvaluationOut]
    pages: List[PagePreviewOut]
    agent_statuses: List[ReportAgentStatusOut]
    mermaid_chart: Optional[str]
    processing_summary: Optional[str]


class ProviderSelectionRequest(BaseModel):
    provider: OcrProvider

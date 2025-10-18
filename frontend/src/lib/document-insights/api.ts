import { handleResponse } from "@/lib/common/http";
import { mapDocumentSummary } from "@/lib/common/mappers";
import type { DocumentSummary, OcrProvider } from "@/lib/common/types";

import type {
  DocumentInsightsPayload,
  PagePreview,
  PageProviderResult,
  ProviderEvaluation,
  RawDocumentInsightsPayload,
  RawPagePreview,
  RawPageProviderResult,
  RawProviderEvaluation,
  RawReportAgentStatus,
  ReportAgentStatus,
} from "./types";
import type { RawDocumentSummary } from "@/lib/common/mappers";

function mapProviderEvaluation(raw: RawProviderEvaluation): ProviderEvaluation {
  return {
    provider: raw.provider,
    displayName: raw.display_name,
    llmJudgeScore: raw.llm_judge_score,
    timePerPageMs: raw.time_per_page_ms,
    estimatedTotalTimeMs: raw.estimated_total_time_ms,
    costPerPage: raw.cost_per_page ?? null,
    estimatedTotalCost: raw.estimated_total_cost ?? null,
    qualityNotes: raw.quality_notes ?? null,
    latencyMs: raw.latency_ms ?? null,
    isBestQuality: raw.is_best_quality,
    isFastest: raw.is_fastest,
    isMostAffordable: raw.is_most_affordable,
  };
}

function mapPageProviderResult(raw: RawPageProviderResult): PageProviderResult {
  return {
    provider: (raw.provider ?? "") as OcrProvider,
    textContent: raw.text_content ?? "",
    validity: raw.validity ?? null,
    llmJudgeScore: raw.llm_judge_score ?? null,
    processingTimeMs: raw.processing_time_ms ?? null,
    costPerPage: raw.cost_per_page ?? null,
    remarks: raw.remarks ?? raw.notes ?? null,
    displayName: raw.display_name ?? null,
  };
}

function mapPagePreview(raw: RawPagePreview): PagePreview {
  return {
    pageNumber: raw.page_number,
    imagePath: raw.image_path ?? null,
    textContent: raw.text_content,
    providerResults: Array.isArray(raw.provider_results)
      ? raw.provider_results.map(mapPageProviderResult)
      : undefined,
  };
}

function mapReportAgentStatus(raw: RawReportAgentStatus): ReportAgentStatus {
  return {
    agentName: raw.agent_name,
    status: raw.status,
    description: raw.description ?? null,
  };
}

export async function fetchDocumentInsights(
  documentId: string,
): Promise<DocumentInsightsPayload> {
  const response = await fetch(`/api/documents/${documentId}/insights`);
  const data = await handleResponse<RawDocumentInsightsPayload>(response);
  return {
    document: mapDocumentSummary(data.document),
    providerEvaluations: (data.provider_evaluations ?? []).map(mapProviderEvaluation),
    pages: (data.pages ?? []).map(mapPagePreview),
    agentStatuses: (data.agent_statuses ?? []).map(mapReportAgentStatus),
    mermaidChart: data.mermaid_chart ?? null,
    selectionRationale: data.selection_rationale ?? null,
  };
}

export async function updateDocumentSelection(
  documentId: string,
  provider: OcrProvider,
): Promise<DocumentSummary> {
  const response = await fetch(`/api/documents/${documentId}/selection`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  const data = await handleResponse<RawDocumentSummary>(response);
  return mapDocumentSummary(data);
}

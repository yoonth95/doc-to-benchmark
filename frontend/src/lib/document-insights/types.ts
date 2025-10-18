import type { RawDocumentSummary } from "@/lib/common/mappers";
import type { DocumentSummary, OcrProvider } from "@/lib/common/types";

export interface ProviderEvaluation {
  provider: OcrProvider;
  displayName: string;
  llmJudgeScore: number;
  timePerPageMs: number;
  estimatedTotalTimeMs: number;
  costPerPage: number | null;
  estimatedTotalCost: number | null;
  qualityNotes?: string | null;
  latencyMs?: number | null;
  isBestQuality: boolean;
  isFastest: boolean;
  isMostAffordable: boolean;
}

export interface RawProviderEvaluation {
  provider: OcrProvider;
  display_name: string;
  llm_judge_score: number;
  time_per_page_ms: number;
  estimated_total_time_ms: number;
  cost_per_page: number | null;
  estimated_total_cost: number | null;
  quality_notes?: string | null;
  latency_ms?: number | null;
  is_best_quality: boolean;
  is_fastest: boolean;
  is_most_affordable: boolean;
}

export interface PageProviderResult {
  provider: OcrProvider;
  textContent: string;
  validity?: string | boolean | null;
  llmJudgeScore?: number | null;
  processingTimeMs?: number | null;
  costPerPage?: number | null;
  remarks?: string | null;
  displayName?: string | null;
}

export interface RawPageProviderResult {
  provider?: OcrProvider | null;
  text_content?: string | null;
  validity?: string | boolean | null;
  llm_judge_score?: number | null;
  processing_time_ms?: number | null;
  cost_per_page?: number | null;
  remarks?: string | null;
  notes?: string | null;
  display_name?: string | null;
}

export interface PagePreview {
  pageNumber: number;
  imagePath?: string | null;
  textContent: string;
  providerResults?: PageProviderResult[];
}

export interface RawPagePreview {
  page_number: number;
  image_path?: string | null;
  text_content: string;
  provider_results?: RawPageProviderResult[];
}

export interface ReportAgentStatus {
  agentName: string;
  status: "pending" | "running" | "completed" | "failed";
  description?: string | null;
}

export interface RawReportAgentStatus {
  agent_name: string;
  status: "pending" | "running" | "completed" | "failed";
  description?: string | null;
}

export interface DocumentInsightsPayload {
  document: DocumentSummary;
  providerEvaluations: ProviderEvaluation[];
  pages: PagePreview[];
  agentStatuses: ReportAgentStatus[];
  mermaidChart?: string | null;
  selectionRationale?: string | null;
}

export interface RawDocumentInsightsPayload {
  document: RawDocumentSummary;
  provider_evaluations?: RawProviderEvaluation[];
  pages?: RawPagePreview[];
  agent_statuses?: RawReportAgentStatus[];
  mermaid_chart?: string | null;
  selection_rationale?: string | null;
}

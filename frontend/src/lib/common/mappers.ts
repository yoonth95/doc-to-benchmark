import type { DocumentSummary, OcrProvider } from "./types";

export interface RawDocumentSummary {
  id: string;
  original_name: string;
  stored_name: string;
  size_bytes: number;
  extension?: string | null;
  language?: string | null;
  status: DocumentSummary["status"];
  uploaded_at: string;
  processed_at?: string | null;
  quality_score?: number | null;
  pages_count: number;
  analysis_items_count: number;
  recommended_strategy?: OcrProvider | null;
  recommendation_notes?: string | null;
  selected_strategy?: OcrProvider | null;
  selection_rationale?: string | null;
  ocr_speed_ms_per_page?: number | null;
  benchmark_url?: string | null;
}

export function mapDocumentSummary(raw: RawDocumentSummary): DocumentSummary {
  return {
    id: raw.id,
    originalName: raw.original_name,
    storedName: raw.stored_name,
    sizeBytes: raw.size_bytes,
    extension: raw.extension ?? null,
    language: raw.language ?? null,
    status: raw.status,
    uploadedAt: raw.uploaded_at,
    processedAt: raw.processed_at ?? null,
    qualityScore: raw.quality_score ?? null,
    pagesCount: raw.pages_count,
    analysisItemsCount: raw.analysis_items_count,
    recommendedStrategy: raw.recommended_strategy ?? null,
    recommendationNotes: raw.recommendation_notes ?? null,
    selectedStrategy: raw.selected_strategy ?? null,
    selectionRationale: raw.selection_rationale ?? null,
    ocrSpeedMsPerPage: raw.ocr_speed_ms_per_page ?? null,
    benchmarkUrl: raw.benchmark_url ?? null,
  };
}

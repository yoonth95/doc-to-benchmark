export type DocumentStatus = "uploaded" | "ocr_processing" | "completed" | "error";

export type OcrProvider = string;

export interface DocumentSummary {
  id: string;
  originalName: string;
  storedName: string;
  sizeBytes: number;
  extension?: string | null;
  language?: string | null;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt?: string | null;
  qualityScore?: number | null;
  pagesCount: number;
  analysisItemsCount: number;
  recommendedStrategy?: OcrProvider | null;
  recommendationNotes?: string | null;
  selectedStrategy?: OcrProvider | null;
  selectionRationale?: string | null;
  ocrSpeedMsPerPage?: number | null;
  benchmarkUrl?: string | null;
}

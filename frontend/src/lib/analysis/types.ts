import type { RawDocumentSummary } from "@/lib/common/mappers";

export interface AnalysisItem {
  id: number;
  documentId: string;
  question: string;
  answer: string;
  contextType: string;
  confidence: number;
  pageNumber: number;
  documentName: string;
}

export interface RawAnalysisItem {
  id: number;
  document_id: string;
  question: string;
  answer: string;
  context_type: string;
  confidence: number;
  page_number: number;
  document_name: string;
}

export interface RawDocumentsResponse {
  items: RawDocumentSummary[];
}

export interface RawAnalysisItemsResponse {
  items: RawAnalysisItem[];
}

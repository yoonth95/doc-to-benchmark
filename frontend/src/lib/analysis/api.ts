import { handleResponse } from "@/lib/common/http";
import { mapDocumentSummary } from "@/lib/common/mappers";
import type { DocumentSummary } from "@/lib/common/types";

import type {
  AnalysisItem,
  RawAnalysisItem,
  RawAnalysisItemsResponse,
  RawDocumentsResponse,
} from "./types";

function mapAnalysisItem(raw: RawAnalysisItem): AnalysisItem {
  return {
    id: raw.id,
    documentId: raw.document_id,
    question: raw.question,
    answer: raw.answer,
    contextType: raw.context_type,
    confidence: raw.confidence,
    pageNumber: raw.page_number,
    documentName: raw.document_name,
  };
}

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch("/api/documents");
  const data = await handleResponse<RawDocumentsResponse>(response);
  return data.items.map(mapDocumentSummary);
}

export async function fetchAnalysisItems(): Promise<AnalysisItem[]> {
  const response = await fetch("/api/analysis-items");
  const data = await handleResponse<RawAnalysisItemsResponse>(response);
  return data.items.map(mapAnalysisItem);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let message = "문서 삭제에 실패했습니다";
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) {
        message = payload.detail;
      }
    } catch {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }
    throw new Error(message);
  }
}

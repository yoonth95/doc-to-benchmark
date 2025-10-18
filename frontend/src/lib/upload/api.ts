import { handleResponse } from "@/lib/common/http";
import { mapDocumentSummary } from "@/lib/common/mappers";
import type { DocumentSummary } from "@/lib/common/types";
import type { RawDocumentSummary } from "@/lib/common/mappers";

export interface UploadDocumentPayload {
  file: File;
  apiKey: string;
}

export async function uploadDocument({
  file,
  apiKey,
}: UploadDocumentPayload): Promise<DocumentSummary> {
  if (!apiKey) {
    throw new Error("API 키가 필요합니다.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const requestInit: RequestInit = {
    method: "POST",
    body: formData,
  };

  if (apiKey) {
    requestInit.headers = {
      "x-ocr-api-key": apiKey,
    };
  }

  const response = await fetch("/api/uploads", requestInit);
  const data = await handleResponse<{ document: RawDocumentSummary }>(response);
  return mapDocumentSummary(data.document);
}

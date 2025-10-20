import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { DocumentSummary, DocumentStatus } from "@/lib/common";
import type { DocumentInsightsPayload } from "@/lib/document-insights";

type DocumentStatusEvent = {
  documentId: string;
  status: DocumentStatus;
  uploadedAt?: string;
  processedAt?: string | null;
  pagesCount?: number;
  message?: string | null;
};

type DocumentProgressEvent = {
  documentId: string;
  stages: Record<string, string>;
  agents?: Array<{ agent: string; status: string; description?: string | null }>;
  mermaid?: string | null;
};

type DocumentDeletedEvent = {
  documentId: string;
};

function parseEvent<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch (error) {
    console.warn("SSE payload parsing 실패", error);
    return null;
  }
}

function updateDocumentSummary(queryClient: ReturnType<typeof useQueryClient>, payload: DocumentStatusEvent) {
  queryClient.setQueryData<DocumentSummary[]>(["documents"], (prev) => {
    if (!prev) return prev;
    let changed = false;
    const updated = prev.map((item) => {
      if (item.id !== payload.documentId) {
        return item;
      }
      changed = true;
      return {
        ...item,
        status: payload.status ?? item.status,
        pagesCount: payload.pagesCount ?? item.pagesCount,
        processedAt: payload.processedAt !== undefined ? payload.processedAt ?? null : item.processedAt,
      } satisfies DocumentSummary;
    });
    return changed ? updated : prev;
  });

  queryClient.setQueryData<DocumentInsightsPayload>(["document-insights", payload.documentId], (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      document: {
        ...prev.document,
        status: payload.status ?? prev.document.status,
        pagesCount: payload.pagesCount ?? prev.document.pagesCount,
        processedAt: payload.processedAt !== undefined ? payload.processedAt ?? null : prev.document.processedAt,
      },
    } satisfies DocumentInsightsPayload;
  });
}

function updateDocumentProgress(queryClient: ReturnType<typeof useQueryClient>, payload: DocumentProgressEvent) {
  queryClient.setQueryData<DocumentInsightsPayload>(["document-insights", payload.documentId], (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      agentStatuses:
        payload.agents?.map((agent) => ({
          agentName: agent.agent,
          status: agent.status as DocumentInsightsPayload["agentStatuses"][number]["status"],
          description: agent.description ?? null,
        })) ?? prev.agentStatuses,
      mermaidChart: payload.mermaid ?? prev.mermaidChart,
      progressStages: payload.stages ?? prev.progressStages,
    } satisfies DocumentInsightsPayload;
  });
}

function removeDocumentFromCache(queryClient: ReturnType<typeof useQueryClient>, documentId: string) {
  queryClient.setQueryData<DocumentSummary[]>(["documents"], (prev) => {
    if (!prev) return prev;
    return prev.filter((item) => item.id !== documentId);
  });

  queryClient.removeQueries({ queryKey: ["document-insights", documentId] });
}

export function useDocumentStatusStream(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;

    const handleStatus = (event: MessageEvent) => {
      const payload = parseEvent<DocumentStatusEvent>(event);
      if (!payload) return;
      updateDocumentSummary(queryClient, payload);
    };

    const handleProgress = (event: MessageEvent) => {
      const payload = parseEvent<DocumentProgressEvent>(event);
      if (!payload) return;
      updateDocumentProgress(queryClient, payload);
    };

    const handleDeleted = (event: MessageEvent) => {
      const payload = parseEvent<DocumentDeletedEvent>(event);
      if (!payload) return;
      removeDocumentFromCache(queryClient, payload.documentId);
    };

    const connect = () => {
      source?.removeEventListener("document-status", handleStatus as EventListener);
      source?.removeEventListener("document-progress", handleProgress as EventListener);
      source?.removeEventListener("document-deleted", handleDeleted as EventListener);
      source?.close();

      source = new EventSource("/api/documents/events");
      source.addEventListener("document-status", handleStatus as EventListener);
      source.addEventListener("document-progress", handleProgress as EventListener);
      source.addEventListener("document-deleted", handleDeleted as EventListener);
      source.onerror = () => {
        source?.close();
        if (!retryTimer) {
          retryTimer = setTimeout(() => {
            retryTimer = null;
            connect();
          }, 1500);
        }
      };
    };

    connect();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (source) {
        source.removeEventListener("document-status", handleStatus as EventListener);
        source.removeEventListener("document-progress", handleProgress as EventListener);
        source.removeEventListener("document-deleted", handleDeleted as EventListener);
        source.close();
      }
    };
  }, [queryClient]);
}

export function useDocumentProgressStream(documentId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!documentId) return;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;

    const handleStatus = (event: MessageEvent) => {
      const payload = parseEvent<DocumentStatusEvent>(event);
      if (!payload) return;
      updateDocumentSummary(queryClient, payload);
    };

    const handleProgress = (event: MessageEvent) => {
      const payload = parseEvent<DocumentProgressEvent>(event);
      if (!payload) return;
      updateDocumentProgress(queryClient, payload);
    };

    const handleDeleted = (event: MessageEvent) => {
      const payload = parseEvent<DocumentDeletedEvent>(event);
      if (!payload) return;
      removeDocumentFromCache(queryClient, payload.documentId);
      source?.close();
    };

    const connect = () => {
      source?.removeEventListener("document-status", handleStatus as EventListener);
      source?.removeEventListener("document-progress", handleProgress as EventListener);
      source?.removeEventListener("document-deleted", handleDeleted as EventListener);
      source?.close();

      source = new EventSource(`/api/documents/${documentId}/events`);
      source.addEventListener("document-status", handleStatus as EventListener);
      source.addEventListener("document-progress", handleProgress as EventListener);
      source.addEventListener("document-deleted", handleDeleted as EventListener);
      source.onerror = () => {
        source?.close();
        if (!retryTimer) {
          retryTimer = setTimeout(() => {
            retryTimer = null;
            connect();
          }, 1500);
        }
      };
    };

    connect();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (source) {
        source.removeEventListener("document-status", handleStatus as EventListener);
        source.removeEventListener("document-progress", handleProgress as EventListener);
        source.removeEventListener("document-deleted", handleDeleted as EventListener);
        source.close();
      }
    };
  }, [documentId, queryClient]);
}

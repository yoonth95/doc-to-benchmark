import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MermaidContent from "@/components/report/MermaidContent";
import {
  DocumentInfoCards,
  DocumentInsightsHeader,
  DocumentInsightsLayout,
  ProviderComparisonCard,
  RecommendationSummaryCard,
  type ProviderRow,
} from "@/components/document-insights";
import type {
  DocumentInsightsPayload,
  PagePreview,
  PageProviderResult,
  ProviderEvaluation,
} from "@/lib/document-insights";
import { fetchDocumentInsights, updateDocumentSelection } from "@/lib/document-insights";
import type { DocumentSummary, OcrProvider } from "@/lib/common";
import { useDocumentProgressStream } from "@/lib/events";

type SummaryResult = { kind: "recommended"; value: number } | { kind: "range"; min: number; max: number } | null;
type ProviderQualityNotes = NonNullable<ProviderRow["qualityNotes"]>;

const parseQualityNotes = (raw?: string | null): ProviderQualityNotes | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const judgeScores = (parsed.judge_scores as Record<string, unknown>) ?? {};
    const toNumber = (value: unknown, fallback = 0): number => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const coerced = Number(value);
      return Number.isFinite(coerced) ? coerced : fallback;
    };
    const toTextArray = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item : String(item ?? "")))
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (typeof value === "string" && value.trim()) {
        return [value.trim()];
      }
      return [];
    };
    const fallbackPath = parsed.fallback_path;

    return {
      judge_grade: String(parsed.judge_grade ?? ""),
      judge_rationale: String(parsed.judge_rationale ?? ""),
      judge_scores: {
        S_read: toNumber(judgeScores.S_read),
        S_sent: toNumber(judgeScores.S_sent),
        S_noise: toNumber(judgeScores.S_noise),
        S_table: toNumber(judgeScores.S_table),
        S_fig: toNumber(judgeScores.S_fig),
      },
      llm_confidence: toNumber(parsed.llm_confidence, 0),
      llm_reason: String(parsed.llm_reason ?? ""),
      llm_issues: toTextArray(parsed.llm_issues),
      fallback_path: Array.isArray(fallbackPath)
        ? fallbackPath.map((step) => String(step ?? "")).filter(Boolean)
        : [],
    };
  } catch (error) {
    console.warn("품질 메모 JSON 파싱에 실패했습니다", error);
    return null;
  }
};

const providerDisplay = (provider?: OcrProvider | null, evaluations: ProviderEvaluation[] = []) => {
  if (!provider) return "-";
  const match = evaluations.find((item) => item.provider === provider);
  return match?.displayName ?? provider;
};

const buildProviderResultsMap = (page?: PagePreview) => {
  const map = new Map<OcrProvider, PageProviderResult>();
  page?.providerResults?.forEach((item) => {
    map.set(item.provider, item);
  });
  return map;
};

const buildProviderRows = (
  evaluations: ProviderEvaluation[],
  currentPage: PagePreview | undefined,
  selectedStrategy?: OcrProvider | null,
  recommendedStrategy?: OcrProvider | null
): ProviderRow[] => {
  if (!evaluations.length) {
    return [];
  }

  const providerResultsMap = buildProviderResultsMap(currentPage);

  return evaluations.map((evaluation) => {
    const providerResult = providerResultsMap.get(evaluation.provider);
    const mergedText = providerResult?.textContent ?? currentPage?.textContent ?? "";
    const qualityNotes = parseQualityNotes(providerResult?.remarks ?? evaluation.qualityNotes ?? null);

    return {
      provider: evaluation.provider,
      displayName: providerResult?.displayName ?? evaluation.displayName,
      text: mergedText,
      validity: providerResult?.validity ?? null,
      quality: providerResult?.llmJudgeScore ?? evaluation.llmJudgeScore ?? null,
      timePerPageMs: providerResult?.processingTimeMs ?? evaluation.timePerPageMs ?? null,
      costPerPage: providerResult?.costPerPage ?? evaluation.costPerPage ?? null,
      isBestQuality: evaluation.isBestQuality,
      isFastest: evaluation.isFastest,
      isMostAffordable: evaluation.isMostAffordable,
      isSelected: selectedStrategy === evaluation.provider,
      isRecommended: recommendedStrategy === evaluation.provider,
      qualityNotes,
    };
  });
};

const computeTimeSummary = (
  evaluations: ProviderEvaluation[],
  recommendedEvaluation: ProviderEvaluation | null
): SummaryResult => {
  if (recommendedEvaluation) {
    return { kind: "recommended", value: recommendedEvaluation.estimatedTotalTimeMs };
  }
  if (!evaluations.length) {
    return null;
  }
  const times = evaluations.map((item) => item.estimatedTotalTimeMs);
  const min = Math.min(...times);
  const max = Math.max(...times);
  return { kind: "range", min, max };
};

const computeCostSummary = (
  evaluations: ProviderEvaluation[],
  recommendedEvaluation: ProviderEvaluation | null
): SummaryResult => {
  if (recommendedEvaluation && recommendedEvaluation.estimatedTotalCost != null) {
    return { kind: "recommended", value: recommendedEvaluation.estimatedTotalCost };
  }
  const costs = evaluations.map((item) => item.estimatedTotalCost).filter((value): value is number => value != null);
  if (!costs.length) {
    return null;
  }
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  return { kind: "range", min, max };
};

const DocumentInsights = () => {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const queryClient = useQueryClient();
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  useDocumentProgressStream(documentId);

  const { data, isLoading, isError, error } = useQuery<DocumentInsightsPayload>({
    queryKey: ["document-insights", documentId],
    queryFn: () => fetchDocumentInsights(documentId ?? ""),
    enabled: Boolean(documentId),
  });

  const lastStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const currentStatus = data?.document.status;
    if (!documentId || !currentStatus) return;
    if (lastStatusRef.current === currentStatus) return;
    if (currentStatus === "completed" || currentStatus === "error") {
      queryClient.invalidateQueries({ queryKey: ["document-insights", documentId] });
    }
    lastStatusRef.current = currentStatus;
  }, [data?.document.status, documentId, queryClient]);

  const selectionMutation = useMutation({
    mutationFn: (provider: OcrProvider) => updateDocumentSelection(documentId ?? "", provider),
    onSuccess: (summary: DocumentSummary) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.setQueryData(["document-insights", documentId], (prev: DocumentInsightsPayload | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          document: {
            ...prev.document,
            ...summary,
            recommendedStrategy: summary.recommendedStrategy ?? prev.document.recommendedStrategy,
            recommendationNotes: summary.recommendationNotes ?? prev.document.recommendationNotes,
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["document-insights", documentId] });
      toast.success("선택한 API를 업데이트했습니다");
    },
    onError: (mutationError: unknown) => {
      toast.error((mutationError as Error)?.message ?? "API 선택을 변경하지 못했습니다");
    },
  });

  useEffect(() => {
    setSelectedPageIndex(0);
  }, [documentId, data?.pages.length]);

  const pages = data?.pages ?? [];
  const totalPages = pages.length;
  const currentPage = pages[selectedPageIndex];

  const providerEvaluationsList = useMemo(() => data?.providerEvaluations ?? [], [data?.providerEvaluations]);
  const selectedStrategy = data?.document.selectedStrategy ?? null;
  const recommendedStrategy = data?.document.recommendedStrategy ?? null;

  const providerRows = useMemo<ProviderRow[]>(
    () => buildProviderRows(providerEvaluationsList, currentPage, selectedStrategy, recommendedStrategy),
    [providerEvaluationsList, currentPage, selectedStrategy, recommendedStrategy]
  );

  const documentPagesCount = data?.document?.pagesCount ?? pages.length;

  const recommendedEvaluation = useMemo(() => {
    if (!recommendedStrategy) return null;
    return providerEvaluationsList.find((item) => item.provider === recommendedStrategy) ?? null;
  }, [providerEvaluationsList, recommendedStrategy]);

  const selectedEvaluation = useMemo(() => {
    if (!selectedStrategy) return null;
    return providerEvaluationsList.find((item) => item.provider === selectedStrategy) ?? null;
  }, [providerEvaluationsList, selectedStrategy]);

  const totalTimeSummary = useMemo(
    () => computeTimeSummary(providerEvaluationsList, recommendedEvaluation),
    [providerEvaluationsList, recommendedEvaluation]
  );

  const totalCostSummary = useMemo(
    () => computeCostSummary(providerEvaluationsList, recommendedEvaluation),
    [providerEvaluationsList, recommendedEvaluation]
  );

  const metricEvaluation = recommendedEvaluation ?? selectedEvaluation ?? null;

  const handlePageChange = (direction: "prev" | "next") => {
    if (!pages.length) return;
    setSelectedPageIndex((prev) => {
      if (direction === "prev") {
        return prev === 0 ? prev : prev - 1;
      }
      return prev >= pages.length - 1 ? prev : prev + 1;
    });
  };

  const handleProviderSelection = (provider: OcrProvider) => {
    if (!documentId || !data?.document) return;
    if (provider === data.document.selectedStrategy) {
      toast.info("이미 선택된 API입니다");
      return;
    }
    selectionMutation.mutate(provider);
  };

  if (!documentId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="text-sm text-muted-foreground">분석할 문서를 선택해주세요.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          분석 데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>문서 분석 데이터를 찾을 수 없습니다</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message ?? "문서를 다시 선택한 뒤 시도해주세요."}
            </p>
            <Button onClick={() => navigate("/analysis")}>분석 현황으로 이동</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { document, mermaidChart } = data;

  console.log(providerRows);

  return (
    <DocumentInsightsLayout>
      <DocumentInsightsHeader documentId={document.id} onBack={() => navigate("/analysis")} />

      <DocumentInfoCards document={document} />

      <ProviderComparisonCard
        recommendedLabel={providerDisplay(document.recommendedStrategy, providerEvaluationsList)}
        currentPage={currentPage}
        totalPages={totalPages}
        selectedPageIndex={selectedPageIndex}
        onPageChange={handlePageChange}
        providerRows={providerRows}
      />

      <RecommendationSummaryCard
        document={document}
        providerEvaluations={providerEvaluationsList}
        documentPagesCount={documentPagesCount}
        totalTimeSummary={totalTimeSummary}
        totalCostSummary={totalCostSummary}
        metricEvaluation={metricEvaluation}
        recommendedDisplayName={providerDisplay(document.recommendedStrategy, providerEvaluationsList)}
        onSelectProvider={handleProviderSelection}
        isMutating={selectionMutation.isPending}
      />

      <section className="grid gap-4">
        <MermaidContent mermaidChart={mermaidChart} />
      </section>
    </DocumentInsightsLayout>
  );
};

export default DocumentInsights;

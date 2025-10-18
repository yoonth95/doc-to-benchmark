import { Coins, Sparkles, Star, ThumbsUp, Timer, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DocumentSummary, OcrProvider } from "@/lib/common";
import type { ProviderEvaluation } from "@/lib/document-insights";
import { formatCost, formatDuration } from "@/utils";

type SummaryKind =
  | { kind: "recommended"; value: number }
  | { kind: "range"; min: number; max: number }
  | null;

interface RecommendationSummaryCardProps {
  document: DocumentSummary;
  providerEvaluations: ProviderEvaluation[];
  documentPagesCount: number;
  totalTimeSummary: SummaryKind;
  totalCostSummary: SummaryKind;
  metricEvaluation: ProviderEvaluation | null;
  metricContextLabel: string | null;
  recommendedDisplayName?: string | null;
  onSelectProvider: (provider: OcrProvider) => void;
  isMutating: boolean;
}

const renderSummary = (
  summary: SummaryKind,
  formatter: (value?: number | null) => string,
  unitLabel: string,
  pages: number,
) => {
  if (!summary) {
    return `계산 가능한 ${unitLabel} 정보가 없습니다.`;
  }
  if (summary.kind === "recommended") {
    return `${formatter(summary.value)} (총 ${pages} 페이지)`;
  }
  return `${formatter(summary.min)} ~ ${formatter(summary.max)} (총 ${pages} 페이지)`;
};

const RecommendationSummaryCard = ({
  document,
  providerEvaluations,
  documentPagesCount,
  totalTimeSummary,
  totalCostSummary,
  metricEvaluation,
  metricContextLabel,
  recommendedDisplayName,
  onSelectProvider,
  isMutating,
}: RecommendationSummaryCardProps) => (
  <Card className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1 px-2 py-0">
            <Star className="h-3 w-3" />
            추천 API
          </Badge>
          <span className="text-lg font-semibold text-foreground">
            {recommendedDisplayName ?? "추천 정보를 계산 중입니다"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {document.recommendationNotes ??
            "품질과 처리 시간 데이터를 바탕으로 추천 결과를 계산 중입니다."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            총 처리 시간
          </span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Timer className="h-4 w-4 text-primary" />
            <span>
              {renderSummary(totalTimeSummary, formatDuration, "시간", documentPagesCount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">총 비용</span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            <span>{renderSummary(totalCostSummary, formatCost, "비용", documentPagesCount)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            추천 지표
          </span>
          {metricContextLabel && (
            <span className="text-xs text-muted-foreground">{metricContextLabel}</span>
          )}
          {metricEvaluation ? (
            <div className="flex flex-col gap-1 text-sm text-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                {metricEvaluation.llmJudgeScore.toFixed(1)} 점
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Timer className="h-3 w-3" />
                {formatDuration(metricEvaluation.timePerPageMs)} / 페이지
              </span>
              {metricEvaluation.costPerPage != null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  {formatCost(metricEvaluation.costPerPage)} / 페이지
                </span>
              )}
              {metricEvaluation.estimatedTotalCost != null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  {formatCost(metricEvaluation.estimatedTotalCost)} (총 {documentPagesCount} 페이지)
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">추천 지표를 준비 중입니다.</span>
          )}
        </div>
      </div>
    </div>

    <div className="flex flex-col justify-evenly gap-3">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-muted-foreground">API 선택 변경</h4>
        <p className="text-xs text-muted-foreground">
          원하는 공급자를 선택하면 해당 결과가 보고서에 반영됩니다.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {providerEvaluations.length === 0 ? (
          <p className="text-xs text-muted-foreground">선택 가능한 API가 없습니다.</p>
        ) : (
          providerEvaluations.map((item) => {
            const isActive = document.selectedStrategy === item.provider;
            const isRecommendedChoice = document.recommendedStrategy === item.provider;

            return (
              <Button
                key={item.provider}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "gap-2",
                  isActive &&
                    "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm",
                  !isActive && isRecommendedChoice && "border-primary/40 text-primary",
                )}
                onClick={() => onSelectProvider(item.provider)}
                disabled={isMutating}
              >
                {isMutating && !isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isActive ? (
                  <ThumbsUp className="h-4 w-4" />
                ) : isRecommendedChoice ? (
                  <Star className="h-4 w-4 text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                {item.displayName}
              </Button>
            );
          })
        )}
      </div>
    </div>
  </Card>
);

export default RecommendationSummaryCard;

import { Coins, Sparkles, Star, ThumbsUp, Timer, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DocumentSummary, OcrProvider } from "@/lib/common";
import type { ProviderEvaluation } from "@/lib/document-insights";
import { formatCost, formatDuration } from "@/utils";

type SummaryKind = { kind: "recommended"; value: number } | { kind: "range"; min: number; max: number } | null;

interface RecommendationSummaryCardProps {
  document: DocumentSummary;
  providerEvaluations: ProviderEvaluation[];
  documentPagesCount: number;
  totalTimeSummary: SummaryKind;
  totalCostSummary: SummaryKind;
  metricEvaluation: ProviderEvaluation | null;
  recommendedDisplayName?: string | null;
  onSelectProvider: (provider: OcrProvider) => void;
  isMutating: boolean;
}

const renderSummary = (
  summary: SummaryKind,
  formatter: (value?: number | null) => string,
  unitLabel: string,
  pages: number
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
  recommendedDisplayName,
  onSelectProvider,
  isMutating,
}: RecommendationSummaryCardProps) => (
  <Card className="flex flex-col gap-10 p-6">
    <div className="grid gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-3">
            <Badge variant="secondary" className="gap-1 px-2">
              <Star className="h-3 w-3" />
              추천 API
            </Badge>
            <span className="text-lg font-semibold text-foreground">
              {recommendedDisplayName ?? "추천 정보를 계산 중입니다"}
            </span>
          </div>
          <p className="leading-relaxed text-sm text-muted-foreground">
            {document.recommendationNotes ?? "품질, 처리 시간, 비용 데이터를 기반으로 추천 결과를 계산 중입니다."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">총 처리 시간</span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Timer className="h-4 w-4 text-primary" />
            <span>{renderSummary(totalTimeSummary, formatDuration, "시간", documentPagesCount)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">총 비용</span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            <span>{renderSummary(totalCostSummary, formatCost, "비용", documentPagesCount)}</span>
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">추천 지표</span>
          {metricEvaluation ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground">
              <span className="flex items-center gap-1 font-semibold">
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

    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-muted-foreground">OCR 라이브러리 비교</h4>
        <p className="text-xs text-muted-foreground">
          각 라이브러리의 처리 시간, 비용, 추천 점수를 비교한 뒤 원하는 라이브러리를 선택하세요.
        </p>
      </div>
      {providerEvaluations.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
          선택 가능한 API가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="min-w-[180px]">라이브러리</TableHead>
                <TableHead className="min-w-[160px]">추천 지표</TableHead>
                <TableHead className="min-w-[150px]">총 처리 시간</TableHead>
                <TableHead className="min-w-[150px]">총 비용</TableHead>
                <TableHead className="min-w-[160px]">강점</TableHead>
                <TableHead className="w-[120px] text-center">선택</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerEvaluations.map((item) => {
                const isActive = document.selectedStrategy === item.provider;
                const isRecommendedChoice = document.recommendedStrategy === item.provider;
                const buttonLabel = isActive
                  ? `${item.displayName} 라이브러리가 현재 선택되었습니다`
                  : isMutating
                  ? `${item.displayName} 라이브러리를 적용하는 중입니다`
                  : `${item.displayName} 라이브러리로 변경`;

                return (
                  <TableRow
                    key={item.provider}
                    className={cn("border-transparent", isActive && "border-l-primary bg-primary/10")}
                  >
                    <TableCell className="align-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{item.displayName}</span>
                          {isRecommendedChoice && (
                            <Badge variant="outline" className="border-primary/60 text-primary">
                              추천
                            </Badge>
                          )}
                          {isActive && <Badge variant="secondary">선택됨</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1 font-semibold">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {item.llmJudgeScore.toFixed(1)} 점
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {formatDuration(item.timePerPageMs)} / 페이지
                        </span>
                        {item.costPerPage != null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Coins className="h-3 w-3" />
                            {formatCost(item.costPerPage)} / 페이지
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex flex-col gap-1 text-sm">
                        <span>{formatDuration(item.estimatedTotalTimeMs)}</span>
                        <span className="text-xs text-muted-foreground">총 {documentPagesCount} 페이지 기준</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex flex-col gap-1 text-sm">
                        <span>{formatCost(item.estimatedTotalCost)}</span>
                        {item.costPerPage != null && (
                          <span className="text-xs text-muted-foreground">{formatCost(item.costPerPage)} / 페이지</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex flex-wrap gap-1">
                        {item.isBestQuality && (
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            품질
                          </Badge>
                        )}
                        {item.isFastest && (
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            속도
                          </Badge>
                        )}
                        {item.isMostAffordable && (
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            비용
                          </Badge>
                        )}
                        {!item.isBestQuality && !item.isFastest && !item.isMostAffordable && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-center">
                      <Button
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className={cn(
                          "w-full justify-center gap-1",
                          isActive && "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                        )}
                        onClick={() => onSelectProvider(item.provider)}
                        disabled={isActive || isMutating}
                        aria-label={buttonLabel}
                        title={buttonLabel}
                      >
                        {isActive ? (
                          <>
                            <ThumbsUp className="h-4 w-4" />
                            선택됨
                          </>
                        ) : isMutating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            변경 중
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-primary" />
                            선택
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  </Card>
);

export default RecommendationSummaryCard;

import { ArrowLeft, HelpCircle, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PagePreview } from "@/lib/document-insights";
import type { ProviderRow } from "./types";
import ClampedTextCell from "./ClampedTextCell";
import { formatCost, formatDuration, formatValidity } from "@/utils";

interface ProviderComparisonCardProps {
  title?: string;
  recommendedLabel?: string | null;
  currentPage?: PagePreview;
  totalPages?: number;
  selectedPageIndex: number;
  onPageChange: (direction: "prev" | "next") => void;
  providerRows: ProviderRow[];
  emptyMessage?: string;
}

interface HeaderLabelProps {
  label: string;
  tooltip?: string;
  align?: "left" | "center" | "right";
}

const HeaderLabel = ({ label, tooltip, align = "center" }: HeaderLabelProps) => {
  const alignClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <div className={["flex items-center gap-1", alignClass].join(" ")}>
      <span>{label}</span>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              role="button"
              aria-label={`${label} 설명 보기`}
              className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
};

const ProviderComparisonCard = ({
  title = "페이지별 OCR 비교",
  recommendedLabel,
  currentPage,
  totalPages = 0,
  selectedPageIndex,
  onPageChange,
  providerRows,
  emptyMessage = "평가 데이터가 아직 준비되지 않았습니다.",
}: ProviderComparisonCardProps) => (
  <section className="flex flex-col gap-4">
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">{title}</span>
          </div>
          {recommendedLabel && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              추천: {recommendedLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button size="icon" variant="outline" onClick={() => onPageChange("prev")} disabled={selectedPageIndex === 0}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant="outline">{totalPages ? `${selectedPageIndex + 1} / ${totalPages}` : "-"}</Badge>
          <Button
            size="icon"
            variant="outline"
            onClick={() => onPageChange("next")}
            disabled={!totalPages || selectedPageIndex >= totalPages - 1}
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
      <div className="grid gap-6 px-6 py-6">
        <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-2">
          {currentPage?.imagePath ? (
            <img
              src={currentPage.imagePath}
              alt={`문서 페이지 ${currentPage.pageNumber}`}
              className="max-h-[460px] w-full rounded-lg object-contain shadow-sm"
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              {totalPages > 0 ? "페이지 이미지가 아직 준비되지 않았습니다." : "표시할 페이지 데이터가 없습니다."}
            </div>
          )}
        </div>
        <ScrollArea className="max-h-[520px] w-full rounded-xl border border-border bg-card">
          <div className="min-w-[720px]">
            <TooltipProvider delayDuration={150}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] whitespace-nowrap">
                      <HeaderLabel label="API 라이브러리" align="left" />
                    </TableHead>
                    <TableHead className="w-[300px] whitespace-nowrap">
                      <HeaderLabel label="텍스트 추출 결과" align="left" />
                    </TableHead>
                    <TableHead className="w-[100px] whitespace-nowrap text-center">
                      <HeaderLabel
                        label="검증 상태"
                        tooltip="OCR 결과가 사전 정의된 유효성 검증 절차를 통과했는지 여부입니다."
                      />
                    </TableHead>
                    <TableHead className="w-[120px] whitespace-nowrap text-center">
                      <HeaderLabel
                        label="LLM 품질 점수"
                        tooltip="LLM Judge가 페이지 품질을 평가한 점수로 높을수록 결과가 정확함을 의미합니다."
                      />
                    </TableHead>
                    <TableHead className="w-[140px] whitespace-nowrap text-center">
                      <HeaderLabel
                        label="페이지당 처리 시간"
                        tooltip="해당 제공자가 한 페이지를 처리하는 데 걸린 평균 시간입니다."
                      />
                    </TableHead>
                    <TableHead className="w-[140px] whitespace-nowrap text-center">
                      <HeaderLabel label="페이지당 비용" tooltip="한 페이지를 처리하는 데 필요한 예상 비용입니다." />
                    </TableHead>
                    <TableHead className="w-[300px] whitespace-nowrap text-center">
                      <HeaderLabel label="LLM 판단 근거" tooltip="LLM Judge가 점수를 매기면서 남긴 설명입니다." />
                    </TableHead>
                    <TableHead className="w-[150px] whitespace-nowrap">
                      <HeaderLabel
                        label="LLM 감지 이슈"
                        align="left"
                        tooltip="LLM Judge가 발견한 오류나 주의 사항 목록입니다."
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    providerRows.map((row) => {
                      const rowAccent =
                        row.isBestQuality && row.isFastest && row.isMostAffordable
                          ? "bg-primary/10"
                          : row.isBestQuality && row.isFastest
                          ? "bg-lime-50/60"
                          : row.isBestQuality
                          ? "bg-amber-50/60"
                          : row.isFastest
                          ? "bg-emerald-50/60"
                          : row.isMostAffordable
                          ? "bg-sky-50/60"
                          : row.isSelected
                          ? "bg-secondary/20"
                          : row.isRecommended
                          ? "bg-primary/10"
                          : "";

                      return (
                        <TableRow key={row.provider} className={rowAccent}>
                          <TableCell className="align-center">
                            <div className="flex flex-col gap-2">
                              <span className="font-medium text-foreground">{row.displayName}</span>
                              <div className="flex flex-wrap gap-1">
                                {row.isSelected && (
                                  <Badge variant="outline" className="border-secondary text-secondary">
                                    선택됨
                                  </Badge>
                                )}
                                {row.isRecommended && (
                                  <Badge variant="outline" className="border-primary text-primary">
                                    추천
                                  </Badge>
                                )}
                                {row.isBestQuality && (
                                  <Badge className="bg-amber-500 text-amber-950" variant="secondary">
                                    최고 품질
                                  </Badge>
                                )}
                                {row.isFastest && (
                                  <Badge className="bg-emerald-500 text-emerald-950" variant="secondary">
                                    최단 시간
                                  </Badge>
                                )}
                                {row.isMostAffordable && (
                                  <Badge className="bg-sky-500 text-sky-950" variant="secondary">
                                    최저 비용
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[300px] align-center">
                            <ClampedTextCell text={row.text} />
                          </TableCell>
                          <TableCell className="w-[100px] align-center text-center text-sm text-foreground">
                            {formatValidity(row.validity)}
                          </TableCell>
                          <TableCell className="w-[120px] align-center text-center text-sm text-foreground">
                            {row.quality != null ? row.quality.toFixed(1) : "-"}
                          </TableCell>
                          <TableCell className="w-[140px] align-center text-center text-sm text-foreground">
                            {formatDuration(row.timePerPageMs)}
                          </TableCell>
                          <TableCell className="w-[140px] align-center text-center text-sm text-foreground">
                            {formatCost(row.costPerPage)}
                          </TableCell>
                          <TableCell className="w-[300px] align-center">
                            <ClampedTextCell text={row.qualityNotes?.llm_reason ?? "-"} />
                          </TableCell>
                          <TableCell className="w-[150px] align-center text-center">
                            <ClampedTextCell text={row.qualityNotes?.llm_issues?.join("\n") ?? "-"} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  </section>
);

export default ProviderComparisonCard;

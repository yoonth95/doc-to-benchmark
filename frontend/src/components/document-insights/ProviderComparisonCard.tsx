import { ArrowLeft, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
          <Button
            size="icon"
            variant="outline"
            onClick={() => onPageChange("prev")}
            disabled={selectedPageIndex === 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant="outline">
            {totalPages ? `${selectedPageIndex + 1} / ${totalPages}` : "-"}
          </Badge>
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
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_1.85fr]">
        <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-2">
          {currentPage?.imagePath ? (
            <img
              src={currentPage.imagePath}
              alt={`문서 페이지 ${currentPage.pageNumber}`}
              className="max-h-[460px] w-full rounded-lg object-contain shadow-sm"
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              {totalPages > 0
                ? "페이지 이미지가 아직 준비되지 않았습니다."
                : "표시할 페이지 데이터가 없습니다."}
            </div>
          )}
        </div>
        <ScrollArea className="max-h-[520px] w-full rounded-xl border border-border bg-card">
          <div className="min-w-[720px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] whitespace-nowrap">API 라이브러리</TableHead>
                  <TableHead className="w-[300px] whitespace-nowrap">텍스트 추출 결과</TableHead>
                  <TableHead className="w-[100px] whitespace-nowrap text-center">유효성</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap text-center">
                    품질 (LLM-Judge)
                  </TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap text-center">
                    페이지별 처리 시간
                  </TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap text-center">
                    페이지별 비용
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  providerRows.map((row) => {
                    const rowAccent =
                      row.isBestQuality && row.isFastest && row.isMostAffordable
                        ? "border-l-4 border-primary bg-primary/10"
                        : row.isBestQuality && row.isFastest
                          ? "border-l-4 border-lime-400 bg-lime-50/60"
                          : row.isBestQuality
                            ? "border-l-4 border-amber-400 bg-amber-50/60"
                            : row.isFastest
                              ? "border-l-4 border-emerald-400 bg-emerald-50/60"
                              : row.isMostAffordable
                                ? "border-l-4 border-sky-400 bg-sky-50/60"
                                : row.isSelected
                                  ? "border-l-4 border-secondary bg-secondary/20"
                                  : row.isRecommended
                                    ? "border-l-4 border-primary bg-primary/10"
                                    : "";

                    return (
                      <TableRow key={row.provider} className={rowAccent}>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">{row.displayName}</span>
                            <span className="text-xs text-muted-foreground">{row.provider}</span>
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
                                <Badge
                                  className="bg-emerald-500 text-emerald-950"
                                  variant="secondary"
                                >
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
                        <TableCell className="w-[300px] align-top">
                          <ClampedTextCell text={row.text} />
                        </TableCell>
                        <TableCell className="w-[100px] align-top text-center text-sm text-foreground">
                          {formatValidity(row.validity)}
                        </TableCell>
                        <TableCell className="w-[120px] align-top text-center text-sm text-foreground">
                          {row.quality != null ? row.quality.toFixed(1) : "-"}
                        </TableCell>
                        <TableCell className="w-[140px] align-top text-center text-sm text-foreground">
                          {formatDuration(row.timePerPageMs)}
                        </TableCell>
                        <TableCell className="w-[140px] align-top text-center text-sm text-foreground">
                          {formatCost(row.costPerPage)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  </section>
);

export default ProviderComparisonCard;

import { useMemo, useState } from "react";
import { FileText, FileBarChart, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnalysisItem, fetchAnalysisItems } from "@/lib/api-client";

const Analysis = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analysis-items"],
    queryFn: fetchAnalysisItems,
  });

  const items = useMemo(() => data ?? [], [data]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const lower = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(lower) ||
        item.documentName.toLowerCase().includes(lower),
    );
  }, [items, searchQuery]);

  const totalDocuments = useMemo(() => {
    const ids = new Set(items.map((item) => item.documentId));
    return ids.size;
  }, [items]);

  const averageConfidence = items.length
    ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="text-sm text-muted-foreground">분석 데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="text-sm text-destructive">
          {(error as Error)?.message ?? "분석 데이터를 불러오지 못했습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
      <div className="container mx-auto flex-1 px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">문서 분석 현황</h2>
            <p className="text-sm text-muted-foreground mt-1">
              추출된 질문과 답변, 신뢰도 데이터를 확인하세요.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">총 추출 항목</span>
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{items.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">평균 신뢰도</span>
                <FileBarChart className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-3xl font-bold">{averageConfidence.toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">처리된 문서</span>
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div className="text-3xl font-bold">{totalDocuments}</div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="질문이나 파일명으로 검색..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold">파일명</th>
                    <th className="p-4 text-center text-sm font-semibold">페이지</th>
                    <th className="p-4 text-center text-sm font-semibold">신뢰도</th>
                    <th className="p-4 text-center text-sm font-semibold">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                        검색 조건에 해당하는 분석 항목이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item: AnalysisItem, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-border transition-colors hover:bg-muted/30 ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/10"
                        }`}
                      >
                        <td className="max-w-xs p-4">
                          <p
                            className="truncate text-sm text-muted-foreground"
                            title={item.documentName}
                          >
                            {item.documentName}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline">{item.pageNumber}</Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant="outline"
                            className={
                              item.confidence >= 90
                                ? "border-success text-success"
                                : item.confidence >= 80
                                  ? "border-secondary text-secondary"
                                  : "border-muted-foreground text-muted-foreground"
                            }
                          >
                            {item.confidence}%
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/analysis/${item.documentId}`)}
                              className="flex items-center gap-2 hover:border-primary/60 hover:text-primary"
                            >
                              <Sparkles className="h-4 w-4" />
                              상세 보기
                            </Button>
                            <Link
                              to={`https://huggingface.co/datasets/GAYOEN/DOC_RAG_FINANCE_BENCHMARK`}
                              target="_blank"
                              className="flex items-center gap-2 hover:border-primary/60 hover:text-primary"
                            >
                              벤치마크
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

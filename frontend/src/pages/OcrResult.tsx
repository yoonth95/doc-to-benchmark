import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, Sparkles, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import {
  OcrResultItem,
  getOcrResults,
  setOcrResults,
  createFallbackOcrResult,
} from "@/lib/ocrStore";

interface LocationState {
  ocrResults?: OcrResultItem[];
  fileName?: string;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const OcrResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentId } = useParams<{ documentId: string }>();
  const locationState = (location.state as LocationState) ?? {};
  const locationResults = locationState.ocrResults ?? [];

  const [ocrResults, setOcrResultsState] = useState<OcrResultItem[]>(() => {
    if (locationResults.length) {
      return locationResults;
    }

    const cached = getOcrResults();
    if (cached.length) {
      return cached;
    }

    if (documentId) {
      return [createFallbackOcrResult(documentId, locationState.fileName)];
    }

    return [];
  });

  useEffect(() => {
    if (locationResults.length) {
      setOcrResultsState(locationResults);
      setOcrResults(locationResults);
    }
  }, [locationResults]);

  useEffect(() => {
    if (ocrResults.length) {
      setOcrResults(ocrResults);
    }
  }, [ocrResults]);

  const [selectedId, setSelectedId] = useState<string | undefined>(documentId ?? ocrResults[0]?.id);

  useEffect(() => {
    if (documentId) {
      setSelectedId(documentId);
    }
  }, [documentId]);

  useEffect(() => {
    if (!ocrResults.length) {
      return;
    }

    if (!selectedId || !ocrResults.some((item) => item.id === selectedId)) {
      setSelectedId(ocrResults[0]?.id);
    }
  }, [ocrResults, selectedId]);

  const selectedResult = useMemo(
    () => ocrResults.find((item) => item.id === selectedId) ?? ocrResults[0],
    [ocrResults, selectedId],
  );

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [selectedResult?.id]);

  useEffect(() => {
    if (!selectedResult) {
      if (currentPageIndex !== 0) {
        setCurrentPageIndex(0);
      }
      return;
    }

    const total = selectedResult.pages.length;
    if (total === 0 && currentPageIndex !== 0) {
      setCurrentPageIndex(0);
      return;
    }

    if (currentPageIndex > total - 1) {
      setCurrentPageIndex(Math.max(total - 1, 0));
    }
  }, [selectedResult, currentPageIndex]);

  const totalPages = selectedResult?.pages.length ?? 0;
  const activePageIndex = totalPages ? Math.min(currentPageIndex, totalPages - 1) : 0;
  const selectedPage = totalPages ? selectedResult?.pages[activePageIndex] : undefined;
  const canGoPrev = activePageIndex > 0;
  const canGoNext = totalPages ? activePageIndex < totalPages - 1 : false;

  const stats = useMemo(() => {
    if (ocrResults.length === 0) {
      return {
        totalFiles: 0,
        totalPages: 0,
        averageConfidence: 0,
        totalCharacters: 0,
      };
    }

    const totalPages = ocrResults.reduce((sum, item) => sum + item.pages.length, 0);
    const averageConfidence =
      ocrResults.reduce((sum, item) => sum + item.confidence, 0) / ocrResults.length;
    const totalCharacters = ocrResults.reduce(
      (sum, item) =>
        sum +
        item.pages.reduce((pageSum, page) => pageSum + page.text.replace(/\s+/g, "").length, 0),
      0,
    );

    return {
      totalFiles: ocrResults.length,
      totalPages,
      averageConfidence: Number(averageConfidence.toFixed(1)),
      totalCharacters,
    };
  }, [ocrResults]);

  if (ocrResults.length === 0 || !selectedResult) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>OCR 결과를 찾을 수 없어요</CardTitle>
            <CardDescription>
              {documentId
                ? `문서 ID ${documentId}에 대한 OCR 결과가 아직 준비되지 않았습니다.`
                : "업로드 페이지에서 문서를 업로드하고 다시 시도해주세요."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/analysis")}>
              분석 현황으로 이동
            </Button>
            <Button onClick={() => navigate("/upload")}>업로드 페이지로 이동</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
      <div className="container mx-auto flex-1 px-5 py-5 flex flex-col gap-5 h-fit">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/analysis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">OCR 결과</h1>
                <p className="text-sm text-muted-foreground">
                  업로드한 문서의 추출 텍스트를 검토하세요.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/analysis")}>
              분석 현황 보기
            </Button>
            <Button onClick={() => navigate("/upload")}>다른 문서 업로드</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>처리된 문서</CardDescription>
              <CardTitle className="text-3xl">{stats.totalFiles}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              OCR이 완료된 총 문서 수
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>평균 신뢰도</CardDescription>
              <CardTitle className="text-3xl">{stats.averageConfidence}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              추출된 텍스트의 평균 정확도
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>총 텍스트 문자</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCharacters.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              공백을 제외한 OCR 텍스트 분량
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-2xl">{selectedResult.fileName}</CardTitle>
                    <CardDescription>
                      OCR 처리 일시: {formatDateTime(selectedResult.processedAt)} · 신뢰도{" "}
                      {selectedResult.confidence}%
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 text-xs uppercase">
                    {selectedResult.language}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">문서 페이지</p>
                    <p className="text-lg font-semibold">{selectedResult.pages.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-4">
                  <BarChart3 className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">신뢰도</p>
                    <p className="text-lg font-semibold">{selectedResult.confidence}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-4">
                  <Sparkles className="h-8 w-8 text-accent-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">파일 크기</p>
                    <p className="text-lg font-semibold">{selectedResult.sizeMB} MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">페이지별 OCR 텍스트</CardTitle>
                    <CardDescription>
                      추출된 텍스트를 검토하고 필요한 경우 수정하세요.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-2 py-1 text-xs font-semibold">
                      {totalPages ? `${activePageIndex + 1} / ${totalPages}` : "0 / 0"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          canGoPrev && setCurrentPageIndex((prev) => Math.max(prev - 1, 0))
                        }
                        disabled={!canGoPrev}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          canGoNext &&
                          setCurrentPageIndex((prev) =>
                            totalPages ? Math.min(prev + 1, totalPages - 1) : prev,
                          )
                        }
                        disabled={!canGoNext}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedPage ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {selectedPage.pageNumber} 페이지
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        현재 페이지의 OCR 텍스트 내용을 확인하세요.
                      </span>
                    </div>
                    <ScrollArea className="min-h-100 pr-4">
                      <div className="rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {selectedPage.text}
                        </pre>
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    이 문서는 아직 페이지별 OCR 결과가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcrResult;

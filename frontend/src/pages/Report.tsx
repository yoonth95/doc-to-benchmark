import { FileText, Download, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Report = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();

  const reportData = {
    documentName: "국가안전시스템 개편 종합대책 대국민 보고 (12.31. 기준).pdf",
    processedDate: "2025-09-30",
    totalPages: 45,
    extractedItems: 23,
    confidence: 92,
    agents: [
      { name: "Planner", status: "완료", description: "문서 구조 분석 및 처리 계획 수립" },
      { name: "Judge", status: "완료", description: "문서 품질 및 처리 가능성 평가" },
      { name: "Parsing", status: "완료", description: "OCR 및 텍스트 추출" },
      { name: "Refiner", status: "완료", description: "데이터 정제 및 구조화" },
      { name: "Reporter", status: "완료", description: "최종 리포트 생성" },
    ],
    summary: {
      keyTopics: ["지역안전관리", "구조·구급훈련", "재난안전 상황관리"],
      extractedQuestions: 23,
      averageConfidence: 92,
      processingTime: "2분 34초",
    },
  };

  return (
    <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
      <div className="container mx-auto flex-1 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/analysis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">분석 리포트</h1>
                <p className="text-sm text-muted-foreground">문서 ID: {itemId}</p>
              </div>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-primary to-secondary transition-opacity hover:opacity-90">
            <Download className="mr-2 h-4 w-4" />
            PDF 다운로드
          </Button>
        </div>

        <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">문서 정보</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">파일명</p>
                <p className="font-medium">{reportData.documentName}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">처리일</p>
                <p className="font-medium">{reportData.processedDate}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">총 페이지</p>
                <p className="font-medium">{reportData.totalPages}페이지</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">추출 항목</p>
                <p className="font-medium">{reportData.extractedItems}개</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">Multi-Agent 처리 현황</h2>
            <div className="space-y-4">
              {reportData.agents.map((agent, index) => (
                <div key={index} className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <Badge variant="outline" className="border-success text-success">
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">분석 요약</h2>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">전체 신뢰도</p>
                  <p className="text-sm font-bold">{reportData.summary.averageConfidence}%</p>
                </div>
                <Progress value={reportData.summary.averageConfidence} className="h-2" />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">주요 토픽</p>
                <div className="flex flex-wrap gap-2">
                  {reportData.summary.keyTopics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 pt-4 md:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">추출된 질문 수</p>
                  <p className="text-2xl font-bold">{reportData.summary.extractedQuestions}개</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">처리 시간</p>
                  <p className="text-2xl font-bold">{reportData.summary.processingTime}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">권장사항</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="mb-1 font-medium">높은 품질의 분석 결과</p>
                  <p className="text-sm text-muted-foreground">
                    평균 신뢰도가 90% 이상으로 매우 우수한 결과입니다. 추출된 데이터를 바로 활용할 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                <div>
                  <p className="mb-1 font-medium">추가 검토 권장</p>
                  <p className="text-sm text-muted-foreground">
                    일부 복잡한 표나 그래프가 포함된 페이지는 수동 검토를 권장합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Report;

import { FileText, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import QualityComparison from "@/components/report/QualityComparison";
import CostAnalysis from "@/components/report/CostAnalysis";
import DocInfo from "@/components/report/DocInfo";
import MermaidContent from "@/components/report/MermaidContent";

const Report = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();

  // const reportData = {
  //   documentName: "국가안전시스템 개편 종합대책 대국민 보고 (12.31. 기준).pdf",
  //   processedDate: "2025-09-30",
  //   totalPages: 45,
  //   extractedItems: 23,
  //   confidence: 92,
  //   agents: [
  //     { name: "Planner", status: "완료", description: "문서 구조 분석 및 처리 계획 수립" },
  //     { name: "Judge", status: "완료", description: "문서 품질 및 처리 가능성 평가" },
  //     { name: "Parsing", status: "완료", description: "OCR 및 텍스트 추출" },
  //     { name: "Refiner", status: "완료", description: "데이터 정제 및 구조화" },
  //     { name: "Reporter", status: "완료", description: "최종 리포트 생성" },
  //   ],
  //   summary: {
  //     keyTopics: ["지역안전관리", "구조·구급훈련", "재난안전 상황관리"],
  //     extractedQuestions: 23,
  //     averageConfidence: 92,
  //     processingTime: "2분 34초",
  //   },
  // };

  return (
    <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
      <div className="container mx-auto flex-1 px-5 py-5">
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

        <div className="mx-auto py-8 flex max-w-5xl flex-col gap-6">
          <section>
            <DocInfo />
          </section>

          <section>
            <MermaidContent />
          </section>

          <section>
            <QualityComparison />
          </section>

          <section>
            <CostAnalysis />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Report;

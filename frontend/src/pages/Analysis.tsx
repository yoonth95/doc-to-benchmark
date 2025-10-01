import { useState } from "react";
import { FileText, Bot, FileBarChart, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface DocumentItem {
  id: string;
  question: string;
  targetAnswer: string;
  fileName: string;
  pageNo: number;
  contextType: string;
  confidence: number;
}

const mockData: DocumentItem[] = [
  {
    id: "1",
    question: "22년대 대비 '23년에 시정구 지역안전관리...",
    targetAnswer: "23년에 시정구 지역안전관리위원회 개최 횟...",
    fileName: "국가안전시스템 개편 종합대책 대국민 보고 (12.31. 기준).pdf",
    pageNo: 10,
    contextType: "paragraph",
    confidence: 95,
  },
  {
    id: "2",
    question: "2023년에 실시된 개선된 구조·구급훈련은...",
    targetAnswer: "2023년에는 기존의 '신규구조훈련'과...",
    fileName: "국가안전시스템 개편 종합대책 대국민 보고 (12.31. 기준).pdf",
    pageNo: 11,
    contextType: "paragraph",
    confidence: 92,
  },
  {
    id: "3",
    question: "재난안전 상황관리를 위해 회의 운영면 지...",
    targetAnswer: "재난안전 상황관리를 위해 '23년 1월에는...",
    fileName: "국가안전시스템 개편 종합대책 대국민 보고 (12.31. 기준).pdf",
    pageNo: 13,
    contextType: "paragraph",
    confidence: 88,
  },
  {
    id: "4",
    question: "2024년 세계경제 성장 및 교역 전망치를 바...",
    targetAnswer: "2024년 세계경제는 성장률이 3.6%에서...",
    fileName: "2024년 주요업무 추진계획.pdf",
    pageNo: 4,
    contextType: "paragraph",
    confidence: 91,
  },
  {
    id: "5",
    question: "2024년에 선실업 'K-스카우디' 제도는 어...",
    targetAnswer: "2024년에 선실업 'K-스카우디' 제도는 해...",
    fileName: "2024년 주요업무 추진계획.pdf",
    pageNo: 12,
    contextType: "paragraph",
    confidence: 87,
  },
];

const Analysis = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = mockData.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
              <div className="text-3xl font-bold">{mockData.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">평균 신뢰도</span>
                <FileBarChart className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-3xl font-bold">
                {(
                  mockData.reduce((acc, item) => acc + item.confidence, 0) / mockData.length
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">처리된 문서</span>
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div className="text-3xl font-bold">2</div>
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
                  {filteredData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border transition-colors hover:bg-muted/30 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/10"
                      }`}
                    >
                      <td className="max-w-xs p-4">
                        <p className="truncate text-sm text-muted-foreground" title={item.fileName}>
                          {item.fileName}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline">{item.pageNo}</Badge>
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
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/ocr-result/${item.id}`, {
                                state: { fileName: item.fileName },
                              })
                            }
                            className="hover:border-accent hover:text-accent-foreground"
                          >
                            <Sparkles className="mr-1 h-4 w-4" />
                            OCR 결과
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/chat/${item.id}`)}
                            className="hover:border-primary hover:text-primary"
                          >
                            <Bot className="mr-1 h-4 w-4" />
                            챗봇
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/report/${item.id}`)}
                            className="hover:border-secondary hover:text-secondary"
                          >
                            <FileBarChart className="mr-1 h-4 w-4" />
                            리포트
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

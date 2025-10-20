import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentSummary } from "@/lib/common";
import { formatDateTime } from "@/utils";

interface DocumentInfoCardsProps {
  document: DocumentSummary;
}

const DocumentInfoCards = ({ document }: DocumentInfoCardsProps) => (
  <div className="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">파일명</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="break-words text-base font-semibold text-foreground">{document.originalName}</p>
        <p className="mt-2 text-xs text-muted-foreground">저장 이름: {document.storedName}</p>
        {document.benchmarkUrl && (
          <Button variant="link" size="sm" asChild className="px-0 text-primary">
            <a href={document.benchmarkUrl} target="_blank" rel="noreferrer">
              벤치마크 보기
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">총 페이지</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-foreground">{document.pagesCount}</p>
        <p className="mt-2 text-xs text-muted-foreground">추출된 페이지 수 기준</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">완료 일시</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(document.processedAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground">상태: {statusLabel[document.status]}</p>
      </CardContent>
    </Card>
  </div>
);

export default DocumentInfoCards;

const statusLabel: Record<DocumentSummary["status"], string> = {
  uploaded: "업로드 완료",
  ocr_processing: "OCR 진행 중",
  completed: "완료",
  error: "오류",
};

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const DocInfo = () => {
  const reportData = {
    documentName: "국가안전시스템 개편 종합대책 대국민 보고 (12.31. 기준).pdf",
    processedDate: "2025-09-30",
    totalPages: 45,
    extractedItems: 23,
    confidence: 92,
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">문서 정보</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default DocInfo;

import { Loader2, Sparkles, Link as LinkIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocumentSummary } from "@/lib/common";
import { formatDateTime } from "@/utils";

interface DocumentsTableProps {
  documents: DocumentSummary[];
  onViewDetails: (documentId: string) => void;
  onDeleteDocument?: (document: DocumentSummary) => void;
  isDeleting?: boolean;
  deletingDocumentId?: string | null;
  emptyMessage?: string;
}

const badgeClassName: Record<DocumentSummary["status"], string> = {
  uploaded: "bg-muted text-muted-foreground",
  ocr_processing: "bg-success text-success-foreground",
  completed: "bg-secondary text-secondary-foreground",
  error: "bg-error text-error-foreground",
};

const statusLabel: Record<DocumentSummary["status"], string> = {
  uploaded: "업로드 완료",
  ocr_processing: "OCR 진행 중",
  completed: "완료",
  error: "오류",
};

const DocumentsTable = ({
  documents,
  onViewDetails,
  onDeleteDocument,
  isDeleting = false,
  deletingDocumentId,
  emptyMessage = "검색 조건에 해당하는 문서가 없습니다.",
}: DocumentsTableProps) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="p-4 text-left text-sm font-semibold">파일명</th>
            <th className="p-4 text-center text-sm font-semibold">상태</th>
            <th className="p-4 text-center text-sm font-semibold">OCR</th>
            <th className="p-4 text-center text-sm font-semibold">상세</th>
            <th className="p-4 text-center text-sm font-semibold">벤치마크</th>
            <th className="p-4 text-center text-sm font-semibold">업로드 일시</th>
            <th className="p-4 text-center text-sm font-semibold">완료 일시</th>
            <th className="p-4 text-center text-sm font-semibold">삭제</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            documents.map((item, index) => {
              const ocr = item.selectedStrategy || item.recommendedStrategy;

              return (
                <tr
                  key={item.id}
                  className={`border-b border-border transition-colors hover:bg-muted/30 ${
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  }`}
                >
                  <td className="max-w-xs p-4">
                    <p className="truncate text-sm text-foreground" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={item.storedName}>
                      저장 이름: {item.storedName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">ID: {item.id}</p>
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="outline" className={`py-1.5 text-xs ${badgeClassName[item.status] ?? ""}`}>
                      {statusLabel[item.status]}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    {ocr ? (
                      <Badge variant="outline" className="py-1.5 text-xs">
                        {ocr}
                      </Badge>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      {item.status === "error" ? (
                        <span className="text-xs text-destructive">에러</span>
                      ) : item.status === "uploaded" || item.status === "ocr_processing" ? (
                        <span className="text-xs text-muted-foreground">준비 중</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails(item.id)}
                          className="flex items-center gap-2 h-[30px] hover:border-primary/60 hover:text-primary text-xs"
                        >
                          <Sparkles className="h-3 w-3" />
                          상세 보기
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === "error" ? (
                      <span className="text-xs text-destructive">에러</span>
                    ) : item.benchmarkUrl ? (
                      <Button asChild size="sm" variant="outline" className="gap-2 h-[30px] text-xs">
                        <Link to={item.benchmarkUrl} target="_blank" rel="noreferrer">
                          <LinkIcon className="h-3 w-3" />
                          보기
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">준비 중</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-sm">{formatDateTime(item.uploadedAt)}</td>
                  <td className="p-4 text-center text-sm">{formatDateTime(item.processedAt)}</td>
                  <td className="p-4 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting}
                      onClick={() => onDeleteDocument?.(item)}
                      className="text-destructive hover:text-destructive"
                      aria-label="문서 삭제"
                    >
                      {isDeleting && deletingDocumentId === item.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default DocumentsTable;

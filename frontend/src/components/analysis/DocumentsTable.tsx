import { Sparkles, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocumentSummary } from "@/lib/common";
import { formatDateTime } from "@/utils";

interface DocumentsTableProps {
  documents: DocumentSummary[];
  onViewDetails: (documentId: string) => void;
  emptyMessage?: string;
}

const badgeClassName: Record<DocumentSummary["status"], string> = {
  processing: "bg-success text-success-foreground",
  processed: "bg-secondary text-secondary-foreground",
  failed: "bg-error text-error-foreground",
  uploaded: "bg-muted text-muted-foreground",
};

const DocumentsTable = ({
  documents,
  onViewDetails,
  emptyMessage = "검색 조건에 해당하는 문서가 없습니다.",
}: DocumentsTableProps) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="p-4 text-left text-sm font-semibold">파일명</th>
            <th className="p-4 text-center text-sm font-semibold">상태</th>
            <th className="p-4 text-center text-sm font-semibold">페이지</th>
            <th className="p-4 text-center text-sm font-semibold">상세</th>
            <th className="p-4 text-center text-sm font-semibold">벤치마크</th>
            <th className="p-4 text-center text-sm font-semibold">업로드 일시</th>
            <th className="p-4 text-center text-sm font-semibold">완료 일시</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            documents.map((item, index) => (
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
                  <Badge
                    variant="outline"
                    className={`py-1.5 capitalize ${badgeClassName[item.status] ?? ""}`}
                  >
                    {item.status}
                  </Badge>
                </td>
                <td className="p-4 text-center">
                  <Badge variant="outline">{item.pagesCount}</Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-3">
                    {item.status === "failed" ? (
                      <span className="text-xs text-destructive">에러</span>
                    ) : item.status === "uploaded" ? (
                      <span className="text-xs text-muted-foreground">준비 중</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(item.id)}
                        className="flex items-center gap-2 hover:border-primary/60 hover:text-primary"
                      >
                        <Sparkles className="h-4 w-4" />
                        상세 보기
                      </Button>
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  {item.status === "failed" ? (
                    <span className="text-xs text-destructive">에러</span>
                  ) : item.benchmarkUrl ? (
                    <Button asChild size="sm" variant="outline" className="gap-2">
                      <Link to={item.benchmarkUrl} target="_blank" rel="noreferrer">
                        <LinkIcon className="h-4 w-4" />
                        보기
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">준비 중</span>
                  )}
                </td>
                <td className="p-4 text-center">{formatDateTime(item.uploadedAt)}</td>
                <td className="p-4 text-center">{formatDateTime(item.processedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default DocumentsTable;

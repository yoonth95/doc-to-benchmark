import { useMemo, useState } from "react";
import { FileBarChart, FileText, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DocumentSummary } from "@/lib/common";
import { fetchDocuments } from "@/lib/analysis";
import {
  AnalysisHeader,
  AnalysisPageLayout,
  AnalysisSearchBar,
  AnalysisState,
  AnalysisSummaryCards,
  DocumentsTable,
  type AnalysisSummaryItem,
} from "@/components/analysis";

const Analysis = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error } = useQuery<DocumentSummary[]>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const documents = useMemo(() => data ?? [], [data]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents;
    }
    const lower = searchQuery.toLowerCase();
    return documents.filter((item) => {
      const stored = item.storedName?.toLowerCase() ?? "";
      return (
        item.originalName.toLowerCase().includes(lower) ||
        stored.includes(lower) ||
        item.id.toLowerCase().includes(lower)
      );
    });
  }, [documents, searchQuery]);

  const totalDocuments = documents.length;
  const completedDocuments = useMemo(
    () => documents.filter((item) => item.status === "processed").length,
    [documents],
  );
  const inProgressDocuments = useMemo(
    () => documents.filter((item) => item.status === "processing").length,
    [documents],
  );

  if (isLoading) {
    return <AnalysisState message="분석 데이터를 불러오는 중입니다..." />;
  }

  if (isError) {
    return (
      <AnalysisState
        variant="error"
        message={(error as Error)?.message ?? "분석 데이터를 불러오지 못했습니다."}
      />
    );
  }

  return (
    <AnalysisPageLayout>
      <div className="flex items-center justify-between gap-4">
        <AnalysisHeader />
      </div>

      <div className="mt-6 space-y-6">
        <AnalysisSummaryCards
          items={[
            {
              label: "총 문서",
              value: totalDocuments,
              icon: <FileText className="h-5 w-5 text-primary" />,
            },
            {
              label: "처리 완료",
              value: completedDocuments,
              icon: <FileBarChart className="h-5 w-5 text-secondary" />,
            },
            {
              label: "진행 중",
              value: inProgressDocuments,
              icon: <Timer className="h-5 w-5 text-success" />,
            },
          ] satisfies AnalysisSummaryItem[]}
        />

        <AnalysisSearchBar value={searchQuery} onChange={setSearchQuery} />

        <DocumentsTable
          documents={filteredDocuments}
          onViewDetails={(documentId) => navigate(`/analysis/${documentId}`)}
        />
      </div>
    </AnalysisPageLayout>
  );
};

export default Analysis;

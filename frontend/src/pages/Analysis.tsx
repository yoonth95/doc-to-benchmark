import { useMemo, useState } from "react";
import { FileBarChart, FileText, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DocumentSummary } from "@/lib/common";
import { fetchDocuments, deleteDocument } from "@/lib/analysis";
import { useDocumentStatusStream } from "@/lib/events";
import {
  AnalysisHeader,
  AnalysisPageLayout,
  AnalysisSearchBar,
  AnalysisState,
  AnalysisSummaryCards,
  DocumentsTable,
  type AnalysisSummaryItem,
} from "@/components/analysis";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Analysis = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<DocumentSummary | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  useDocumentStatusStream();

  const queryClient = useQueryClient();
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteDocument,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.removeQueries({ queryKey: ["document-insights", documentId] });
      toast.success("문서를 삭제했습니다");
      setDocumentToDelete(null);
      setDeletingDocumentId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeletingDocumentId(null);
    },
  });

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
  const completedDocuments = useMemo(() => documents.filter((item) => item.status === "completed").length, [documents]);
  const inProgressDocuments = useMemo(
    () => documents.filter((item) => item.status === "uploaded" || item.status === "ocr_processing").length,
    [documents]
  );

  const handleDeleteDocument = (document: DocumentSummary) => {
    setDocumentToDelete(document);
  };

  const handleConfirmDelete = () => {
    if (!documentToDelete) return;
    setDeletingDocumentId(documentToDelete.id);
    deleteMutation.mutate(documentToDelete.id);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !deleteMutation.isPending) {
      setDocumentToDelete(null);
    }
  };

  if (isLoading) {
    return <AnalysisState message="분석 데이터를 불러오는 중입니다..." />;
  }

  if (isError) {
    return (
      <AnalysisState variant="error" message={(error as Error)?.message ?? "분석 데이터를 불러오지 못했습니다."} />
    );
  }

  return (
    <AnalysisPageLayout>
      <div className="flex items-center justify-between gap-4">
        <AnalysisHeader />
      </div>

      <div className="mt-6 space-y-6">
        <AnalysisSummaryCards
          items={
            [
              {
                label: "총 문서",
                value: totalDocuments,
                icon: <FileText className="h-5 w-5 text-primary" />,
              },
              {
                label: "완료",
                value: completedDocuments,
                icon: <FileBarChart className="h-5 w-5 text-secondary" />,
              },
              {
                label: "진행 중",
                value: inProgressDocuments,
                icon: <Timer className="h-5 w-5 text-success" />,
              },
            ] satisfies AnalysisSummaryItem[]
          }
        />

        <AnalysisSearchBar value={searchQuery} onChange={setSearchQuery} />

        <DocumentsTable
          documents={filteredDocuments}
          onViewDetails={(documentId) => navigate(`/analysis/${documentId}`)}
          onDeleteDocument={handleDeleteDocument}
          isDeleting={deleteMutation.isPending}
          deletingDocumentId={deletingDocumentId}
        />
      </div>

      <AlertDialog open={Boolean(documentToDelete)} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {documentToDelete?.originalName ?? "선택된 문서"}의 분석 데이터와 업로드 파일이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && deletingDocumentId === documentToDelete?.id ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnalysisPageLayout>
  );
};

export default Analysis;

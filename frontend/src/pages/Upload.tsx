import { useCallback, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiKey } from "@/hooks/use-api-key";
import {
  ApiKeyField,
  SelectedFileList,
  UploadActions,
  UploadDropzone,
  UploadHeader,
  UploadPageLayout,
} from "@/components/upload";
import type { DocumentSummary } from "@/lib/common";
import { fetchDocuments } from "@/lib/analysis";
import type { UploadDocumentPayload } from "@/lib/upload";
import { uploadDocument } from "@/lib/upload";

const Upload = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { apiKey, setApiKey } = useApiKey();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { data: documents } = useQuery<DocumentSummary[]>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const hasInProgressDocument = useMemo(
    () => documents?.some((item) => item.status === "uploaded" || item.status === "ocr_processing") ?? false,
    [documents],
  );

  const uploadMutation = useMutation<DocumentSummary, Error, UploadDocumentPayload>({
    mutationFn: uploadDocument,
    onSuccess: async (item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: ["analysis-items"] }),
      ]);

      toast.success("문서 업로드가 시작되었습니다. 분석 결과는 분석 페이지에서 자동으로 갱신됩니다.");
      setFile(null);

      navigate("/analysis");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
    }
  }, []);

  const handleDragOver = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };
  const handleFileRemove = useCallback((_file?: File) => {
    setFile(null);
  }, []);

  const handleProcess = () => {
    if (!file) {
      toast.error("파일을 먼저 업로드해주세요");
      return;
    }

    if (!apiKey) {
      toast.error("API 키를 입력해주세요");
      return;
    }

    if (hasInProgressDocument) {
      toast.info("이전 문서 OCR이 완료될 때까지 기다려주세요");
      return;
    }

    uploadMutation.mutate({ file, apiKey });
  };

  const files = useMemo(() => (file ? [file] : []), [file]);

  return (
    <UploadPageLayout>
      <UploadHeader />

      <UploadDropzone
        isDragging={isDragging}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onFileSelect={handleFileInput}
      />

      <SelectedFileList files={files} onRemove={handleFileRemove} />

      <ApiKeyField value={apiKey} onChange={setApiKey} />

      {hasInProgressDocument && (
        <p className="text-sm text-muted-foreground">
          다른 문서의 OCR 처리가 진행 중입니다. 완료되면 새 업로드를 진행할 수 있습니다.
        </p>
      )}

      <UploadActions
        onCancel={() => navigate("/")}
        onSubmit={handleProcess}
        isSubmitting={uploadMutation.isPending}
        isSubmitDisabled={!file || uploadMutation.isPending || hasInProgressDocument}
      />
    </UploadPageLayout>
  );
};

export default Upload;

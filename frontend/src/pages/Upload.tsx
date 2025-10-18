import { useCallback, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { UploadDocumentPayload } from "@/lib/upload";
import { uploadDocument } from "@/lib/upload";

const Upload = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { apiKey, setApiKey } = useApiKey();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation<DocumentSummary, Error, UploadDocumentPayload>({
    mutationFn: uploadDocument,
    onSuccess: async (item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: ["analysis-items"] }),
      ]);

      toast.success("문서 업로드가 완료되었습니다");
      setFile(null);

      // if (item.status === "processed" || item.pagesCount > 0) {
      if (item.status === "processed") {
        navigate(`/analysis/${item.id}`);
      } else {
        navigate("/analysis");
      }
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

      <UploadActions
        onCancel={() => navigate("/")}
        onSubmit={handleProcess}
        isSubmitting={uploadMutation.isPending}
        isSubmitDisabled={!file || uploadMutation.isPending}
      />
    </UploadPageLayout>
  );
};

export default Upload;

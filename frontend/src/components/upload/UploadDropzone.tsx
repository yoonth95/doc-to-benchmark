import { Upload as UploadIcon } from "lucide-react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  inputId?: string;
  accept?: string;
  isDragging?: boolean;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  helperText?: string;
  browseLabel?: string;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}

const UploadDropzone = ({
  inputId = "file-input",
  accept = ".pdf,.docx,.doc,.png,.jpg,.jpeg",
  isDragging = false,
  icon,
  title,
  subtitle,
  helperText = "PDF, DOCX, 이미지 파일 지원",
  browseLabel = "파일 선택",
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
}: UploadDropzoneProps) => {
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDrop(event);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragOver?.(event);
  };

  const handleDragLeave = () => {
    onDragLeave?.();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(event);
    event.target.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <div className="space-y-6 p-12 text-center">
        <div className="flex justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
              isDragging
                ? "scale-110 bg-primary/20"
                : "bg-gradient-to-br from-primary/10 to-secondary/10"
            }`}
          >
            {icon ?? <UploadIcon className="h-10 w-10 text-primary" />}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            {isDragging ? "여기에 파일을 놓으세요" : title ?? "파일을 드래그하거나"}
          </h3>
          <p className="text-muted-foreground">{subtitle ?? helperText}</p>
        </div>

        <div>
          <input
            type="file"
            id={inputId}
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor={inputId}>
            <Button
              size="lg"
              className="cursor-pointer bg-gradient-to-r from-primary to-secondary transition-opacity hover:opacity-90"
              asChild
            >
              <span>{browseLabel}</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UploadDropzone;

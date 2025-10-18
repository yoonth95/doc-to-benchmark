import { FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SelectedFileListProps {
  files: File[];
  onRemove?: (file: File) => void;
  title?: string;
}

const SelectedFileList = ({
  files,
  onRemove,
  title = "업로드된 파일",
}: SelectedFileListProps) => {
  if (!files.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="space-y-2">
        {files.map((file) => {
          const key = `${file.name}-${file.size}`;
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {onRemove ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(file)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedFileList;

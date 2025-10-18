import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UploadCalloutCardProps {
  onClick?: () => void;
  title?: string;
  actionLabel?: string;
}

const UploadCalloutCard = ({
  onClick,
  title = "문서 업로드",
  actionLabel = "시작하기",
}: UploadCalloutCardProps) => (
  <div
    onClick={onClick}
    className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card p-12 transition-all hover:border-primary hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="relative space-y-6">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 transition-transform group-hover:scale-110">
          <Upload className="h-10 w-10 text-primary" />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">드래그 앤 드롭 혹은 파일 선택으로 업로드</p>
      </div>
      <div className="flex justify-center">
        <Button
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  </div>
);

export default UploadCalloutCard;

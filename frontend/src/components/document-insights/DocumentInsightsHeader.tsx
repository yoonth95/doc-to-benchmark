import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DocumentInsightsHeaderProps {
  documentId: string;
  onBack: () => void;
  title?: string;
  subtitlePrefix?: string;
}

const DocumentInsightsHeader = ({
  documentId,
  onBack,
  title = "문서 분석 요약",
  subtitlePrefix = "문서 ID",
}: DocumentInsightsHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
          <FileText className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-xs text-muted-foreground">
            {subtitlePrefix}: {documentId}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default DocumentInsightsHeader;

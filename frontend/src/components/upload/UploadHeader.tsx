interface UploadHeaderProps {
  title?: string;
  description?: string;
}

const UploadHeader = ({
  title = "문서 업로드",
  description = "분석할 문서를 업로드하고 Multi-Agent 시스템으로 처리하세요",
}: UploadHeaderProps) => (
  <div className="space-y-2">
    <h2 className="text-3xl font-bold">{title}</h2>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default UploadHeader;

interface AnalysisHeaderProps {
  title?: string;
  description?: string;
}

const AnalysisHeader = ({
  title = "문서 분석 현황",
  description = "업로드된 문서의 처리 상태와 벤치마크 결과를 확인하세요.",
}: AnalysisHeaderProps) => (
  <div>
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

export default AnalysisHeader;

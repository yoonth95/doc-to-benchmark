import Mermaid from "@/components/common/Mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface MermaidContentProps {
  mermaidChart?: string | null;
}

const MermaidContent = ({ mermaidChart }: MermaidContentProps) => {
  const isMobile = useIsMobile();

  const chart = mermaidChart?.replace(isMobile ? "LR" : "TD", isMobile ? "TD" : "LR");

  if (!chart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Multi-Agent 처리 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">시각화 데이터가 아직 준비되지 않았습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Multi-Agent 처리 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Mermaid theme="default" securityLevel="loose" chart={chart} className="max-w-full overflow-auto w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default MermaidContent;

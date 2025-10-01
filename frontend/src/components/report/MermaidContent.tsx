import Mermaid from "@/components/common/Mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { mermaidCode } from "@/lib/flow-spec";

const MermaidContent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Multi-Agent 처리 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 justify-center">
            <Mermaid
              theme="default" // 필요 시 "default" 등으로 변경
              securityLevel="loose" // HTML 라벨/아이콘 쓰면 loose 권장
              chart={mermaidCode} // flow-spec에서 생성된 Mermaid 문자열
              className="max-w-full overflow-auto"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MermaidContent;

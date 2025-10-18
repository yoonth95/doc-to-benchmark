import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReportAgentStatus } from "@/lib/document-insights";

interface AgentStatusListProps {
  statuses: ReportAgentStatus[];
  emptyMessage?: string;
}

const AgentStatusList = ({
  statuses,
  emptyMessage = "등록된 에이전트 상태가 없습니다.",
}: AgentStatusListProps) => (
  <Card className="flex flex-col">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
        Multi-Agent 상태
      </CardTitle>
    </CardHeader>
    <div className="flex flex-col gap-3 px-4">
      {statuses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        statuses.map((status) => (
          <div
            key={status.agentName}
            className="flex items-center justify-between gap-1 rounded-lg border border-border px-3 py-2"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">{status.agentName}</span>
              <span className="text-xs text-muted-foreground">{status.description ?? "-"}</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {status.status}
            </Badge>
          </div>
        ))
      )}
    </div>
  </Card>
);

export default AgentStatusList;

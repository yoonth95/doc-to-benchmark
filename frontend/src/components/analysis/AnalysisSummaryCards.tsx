import type { ReactNode } from "react";

interface SummaryItem {
  label: string;
  value: number | string;
  icon: ReactNode;
  accentClassName?: string;
}

interface AnalysisSummaryCardsProps {
  items: SummaryItem[];
}

const AnalysisSummaryCards = ({ items }: AnalysisSummaryCardsProps) => (
  <div className="grid gap-4 md:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-border bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
          <span className={item.accentClassName}>{item.icon}</span>
        </div>
        <div className="text-3xl font-bold">{item.value}</div>
      </div>
    ))}
  </div>
);

export type { SummaryItem as AnalysisSummaryItem };
export default AnalysisSummaryCards;

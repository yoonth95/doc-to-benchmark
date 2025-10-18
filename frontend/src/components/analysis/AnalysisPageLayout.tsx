import type { ReactNode } from "react";

interface AnalysisPageLayoutProps {
  children: ReactNode;
}

const AnalysisPageLayout = ({ children }: AnalysisPageLayoutProps) => (
  <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
    <div className="container mx-auto flex-1 px-5 py-5">{children}</div>
  </div>
);

export default AnalysisPageLayout;

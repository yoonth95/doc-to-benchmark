import type { ReactNode } from "react";

interface DocumentInsightsLayoutProps {
  children: ReactNode;
}

const DocumentInsightsLayout = ({ children }: DocumentInsightsLayoutProps) => (
  <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
    <div className="container mx-auto flex-1 px-5 py-5">
      <div className="flex h-fit flex-col gap-6">{children}</div>
    </div>
  </div>
);

export default DocumentInsightsLayout;

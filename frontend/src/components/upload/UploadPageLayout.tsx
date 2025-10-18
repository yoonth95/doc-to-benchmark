import type { ReactNode } from "react";

interface UploadPageLayoutProps {
  children: ReactNode;
}

const UploadPageLayout = ({ children }: UploadPageLayoutProps) => (
  <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
    <div className="container mx-auto flex-1 px-5 py-5">
      <div className="mx-auto max-w-4xl space-y-8">{children}</div>
    </div>
  </div>
);

export default UploadPageLayout;

import type { ReactNode } from "react";

interface NotFoundLayoutProps {
  children: ReactNode;
}

const NotFoundLayout = ({ children }: NotFoundLayoutProps) => (
  <div className="flex h-full w-full items-center justify-center bg-background">{children}</div>
);

export default NotFoundLayout;

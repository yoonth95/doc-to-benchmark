import type { ReactNode } from "react";

interface HomeLayoutProps {
  children: ReactNode;
}

const HomeLayout = ({ children }: HomeLayoutProps) => (
  <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
    <section className="container mx-auto flex-1 px-5 py-5">{children}</section>
  </div>
);

export default HomeLayout;

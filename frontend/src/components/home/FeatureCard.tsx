import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-card)]">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 transition-transform group-hover:scale-110">
      {icon}
    </div>
    <h3 className="mb-2 font-semibold">{title}</h3>
    <p className="text-center text-sm text-muted-foreground">{description}</p>
  </div>
);

export default FeatureCard;

import type { ReactNode } from "react";

import FeatureCard from "./FeatureCard";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FeatureGridProps {
  features: Feature[];
}

const FeatureGrid = ({ features }: FeatureGridProps) => (
  <div className="grid gap-6 md:grid-cols-3">
    {features.map((feature) => (
      <FeatureCard
        key={feature.title}
        icon={feature.icon}
        title={feature.title}
        description={feature.description}
      />
    ))}
  </div>
);

export default FeatureGrid;

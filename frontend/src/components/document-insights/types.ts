import type { OcrProvider } from "@/lib/common";

export interface ProviderRow {
  provider: OcrProvider;
  displayName: string;
  text: string;
  validity?: string | boolean | null;
  quality: number | null;
  timePerPageMs: number | null;
  costPerPage: number | null;
  isBestQuality: boolean;
  isFastest: boolean;
  isMostAffordable: boolean;
  isSelected: boolean;
  isRecommended: boolean;
}

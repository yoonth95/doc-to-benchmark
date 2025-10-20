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
  qualityNotes: QualityNotes | null;
}

export interface QualityNotes {
  judge_grade: string;
  judge_rationale: string;
  judge_scores: {
    S_read: number;
    S_sent: number;
    S_noise: number;
    S_table: number;
    S_fig: number;
  };
  llm_confidence: number;
  llm_reason: string;
  llm_issues: string[];
  fallback_path: string[];
}

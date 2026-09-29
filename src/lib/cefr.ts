export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

// Label format follows the reference design's "Intermediate (B1)".
export const CEFR_LABELS: Record<CefrLevel, string> = {
  A1: "Beginner (A1)",
  A2: "Elementary (A2)",
  B1: "Intermediate (B1)",
  B2: "Upper intermediate (B2)",
  C1: "Advanced (C1)",
  C2: "Proficient (C2)",
};

export const DEFAULT_CEFR_LEVEL: CefrLevel = "B1";

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && CEFR_LEVELS.includes(value as CefrLevel);
}

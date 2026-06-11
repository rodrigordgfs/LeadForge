import type { ScoreBandLabel } from "./score-calculator.js";

export const SCORE_BANDS: Array<{
  label: ScoreBandLabel;
  min: number;
  max: number;
}> = [
  { label: "critical", min: 0, max: 40 },
  { label: "low", min: 41, max: 60 },
  { label: "medium", min: 61, max: 80 },
  { label: "excellent", min: 81, max: 100 },
];

export function getScoreBand(score: number): ScoreBandLabel {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));

  for (const band of SCORE_BANDS) {
    if (normalized >= band.min && normalized <= band.max) {
      return band.label;
    }
  }

  return "critical";
}

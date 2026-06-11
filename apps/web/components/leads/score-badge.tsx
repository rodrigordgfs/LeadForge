import type { ScoreBandLabel } from "@leadforge/shared";

import {
  SCORE_BAND_COLORS,
  SCORE_BAND_LABELS,
} from "@/lib/constants/labels";

interface ScoreBadgeProps {
  score: number | null | undefined;
  band?: ScoreBandLabel | null;
}

export function ScoreBadge({ score, band }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
        Pendente
      </span>
    );
  }

  const resolvedBand = band ?? "critical";
  const colorClass = SCORE_BAND_COLORS[resolvedBand];
  const label = SCORE_BAND_LABELS[resolvedBand];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
      data-testid="score-badge"
    >
      <span>{score}</span>
      <span className="opacity-80">· {label}</span>
    </span>
  );
}

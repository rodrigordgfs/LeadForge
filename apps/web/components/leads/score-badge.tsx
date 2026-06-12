import type { ScoreBandLabel } from "@leadforge/shared";
import { Badge } from "@leadforge/ui";

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
      <Badge variant="outline" data-testid="score-badge">
        Pendente
      </Badge>
    );
  }

  const resolvedBand = band ?? "critical";
  const variant = SCORE_BAND_COLORS[resolvedBand];
  const label = SCORE_BAND_LABELS[resolvedBand];

  return (
    <Badge variant={variant} data-testid="score-badge">
      <span className="font-mono">{score}</span>
      <span className="opacity-80">· {label}</span>
    </Badge>
  );
}

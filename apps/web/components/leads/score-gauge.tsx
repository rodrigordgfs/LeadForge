import type { ScoreBandLabel } from "@leadforge/shared";

import { SCORE_BAND_LABELS } from "@/lib/constants/labels";

interface ScoreGaugeProps {
  score: number | null | undefined;
  band?: ScoreBandLabel | null;
}

export function ScoreGauge({ score, band }: ScoreGaugeProps) {
  const normalizedScore = score ?? 0;
  const resolvedBand = band ?? "critical";
  const label = SCORE_BAND_LABELS[resolvedBand];

  const strokeColor =
    resolvedBand === "excellent"
      ? "#059669"
      : resolvedBand === "medium"
        ? "#ca8a04"
        : resolvedBand === "low"
          ? "#ea580c"
          : "#dc2626";

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2" data-testid="score-gauge">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="fill-slate-900 text-xl font-semibold"
          fontSize="22"
        >
          {score ?? "—"}
        </text>
        <text
          x="60"
          y="78"
          textAnchor="middle"
          className="fill-slate-500"
          fontSize="11"
        >
          / 100
        </text>
      </svg>
      <p className="text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}

"use client";

import { JOB_PHASE_LABELS } from "@/lib/constants/labels";

import type { JobEventsState } from "@/hooks/use-job-events";

interface JobProgressProps {
  state: JobEventsState;
  onRetry?: () => void;
}

export function JobProgress({ state, onRetry }: JobProgressProps) {
  const phaseLabel = JOB_PHASE_LABELS[state.phase] ?? state.phase;

  if (state.status === "idle") {
    return null;
  }

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-live="polite"
      data-testid="job-progress"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-slate-900">
          Progresso da busca
        </h2>
        <span className="text-xs text-slate-500">{phaseLabel}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full transition-all duration-300 ${
            state.status === "failed" ? "bg-red-500" : "bg-emerald-500"
          }`}
          style={{ width: `${state.progressPct}%` }}
          role="progressbar"
          aria-valuenow={state.progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>{state.progressPct}% concluído</span>
        {state.totalFound > 0 ? (
          <span>{state.totalFound} leads encontrados</span>
        ) : null}
      </div>

      {state.status === "failed" ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-red-600">
            {state.errorMessage ?? "A busca falhou. Tente novamente."}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : null}

      {state.status === "completed" ? (
        <p className="mt-2 text-sm text-emerald-700">Busca concluída!</p>
      ) : null}
    </section>
  );
}

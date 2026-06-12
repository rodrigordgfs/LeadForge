"use client";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from "@leadforge/ui";

import { JOB_PHASE_LABELS } from "@/lib/constants/labels";

import type { JobEventsState } from "@/hooks/use-job-events";

interface JobProgressProps {
  state: JobEventsState;
  onRetry?: () => void;
}

function getStatusHint(state: JobEventsState): string | null {
  if (state.status === "failed" || state.status === "completed") {
    return null;
  }

  if (state.phase === "pending" || state.status === "connecting") {
    return "Conectando ao servidor e aguardando o worker…";
  }

  if (state.phase === "running" && state.progressPct <= 5 && state.totalFound === 0) {
    return "Abrindo Google Maps e aguardando a lista de resultados (pode levar 1–3 min).";
  }

  if (state.phase === "scraping" || (state.phase === "running" && state.totalFound > 0)) {
    return "Coletando negócios no Maps — o worker está ativo.";
  }

  if (state.phase === "analyzing") {
    return "Analisando sites e calculando scores dos leads.";
  }

  return "Processando busca em segundo plano…";
}

export function JobProgress({ state, onRetry }: JobProgressProps) {
  const phaseLabel = JOB_PHASE_LABELS[state.phase] ?? state.phase;
  const statusHint = getStatusHint(state);
  const isIndeterminate =
    state.status !== "completed" &&
    state.status !== "failed" &&
    state.phase === "running" &&
    state.progressPct <= 5 &&
    state.totalFound === 0;

  if (state.status === "idle") {
    return null;
  }

  const progressValue = Math.max(
    state.progressPct,
    state.status === "active" ? 5 : 0,
  );

  return (
    <Card
      className="gap-4 py-4"
      aria-live="polite"
      data-testid="job-progress"
    >
      <CardHeader className="px-4 py-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Progresso da busca</CardTitle>
          <Badge variant="secondary">{phaseLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4">
        {isIndeterminate ? (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext="Abrindo Google Maps"
            />
          </div>
        ) : (
          <Progress
            value={state.status === "failed" ? progressValue : progressValue}
            className={
              state.status === "failed"
                ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                : undefined
            }
            role="progressbar"
            aria-valuenow={state.progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-mono">
            {isIndeterminate
              ? "Iniciando scrape no Maps…"
              : `${state.progressPct}% concluído`}
          </span>
          {state.totalFound > 0 ? (
            <span className="font-mono">
              {state.totalFound}{" "}
              {state.phase === "scraping" || state.progressPct <= 25
                ? "encontrados no Maps"
                : "leads encontrados"}
            </span>
          ) : null}
        </div>

        {statusHint ? (
          <p className="text-xs text-muted-foreground">{statusHint}</p>
        ) : null}

        {state.status === "failed" ? (
          <Alert variant="destructive" className="mt-1">
            <AlertDescription className="space-y-2">
              <p>{state.errorMessage ?? "A busca falhou. Tente novamente."}</p>
              {onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                >
                  Tentar novamente
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {state.status === "completed" ? (
          <p className="text-sm text-success">Busca concluída!</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  isTerminalSseEvent,
  sseEventSchema,
  type SseEvent,
} from "@leadforge/shared";

export type JobEventStatus =
  | "idle"
  | "connecting"
  | "active"
  | "completed"
  | "failed";

export interface JobEventsState {
  progressPct: number;
  totalFound: number;
  phase: string;
  status: JobEventStatus;
  errorMessage?: string;
  lastEvent?: SseEvent;
}

export interface UseJobEventsOptions {
  enabled?: boolean;
  onComplete?: (event: Extract<SseEvent, { type: "job_completed" }>) => void;
  onFailed?: (event: Extract<SseEvent, { type: "job_failed" }>) => void;
  onLeadAnalyzed?: (
    event: Extract<SseEvent, { type: "lead_analyzed" }>,
  ) => void;
  onArtifactReady?: (
    event: Extract<SseEvent, { type: "artifact_ready" }>,
  ) => void;
  onEvent?: (event: SseEvent) => void;
}

const initialState: JobEventsState = {
  progressPct: 0,
  totalFound: 0,
  phase: "pending",
  status: "idle",
};

function derivePhaseFromJob(status: string, progressPct: number): string {
  if (status === "completed") {
    return "completed";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "pending") {
    return "pending";
  }
  if (progressPct >= 80) {
    return "analyzing";
  }
  if (progressPct > 0) {
    return "scraping";
  }
  return "running";
}

function stateFromSearchJob(job: {
  status: string;
  progressPct: number;
  totalFound: number;
  errorMessage?: string | null;
}): JobEventsState {
  if (job.status === "completed") {
    return {
      progressPct: 100,
      totalFound: job.totalFound,
      phase: "completed",
      status: "completed",
    };
  }

  if (job.status === "failed") {
    return {
      progressPct: job.progressPct,
      totalFound: job.totalFound,
      phase: "failed",
      status: "failed",
      errorMessage: job.errorMessage ?? "A busca falhou",
    };
  }

  return {
    progressPct: job.progressPct,
    totalFound: job.totalFound,
    phase: derivePhaseFromJob(job.status, job.progressPct),
    status: job.status === "pending" ? "connecting" : "active",
  };
}

function derivePhase(event: SseEvent): string {
  switch (event.type) {
    case "progress":
      return event.payload.progressPct < 30
        ? "running"
        : event.payload.progressPct < 80
          ? "scraping"
          : "analyzing";
    case "lead_scraped":
      return "scraping";
    case "lead_analyzed":
      return "analyzing";
    case "artifact_ready":
      return "analyzing";
    case "job_completed":
      return "completed";
    case "job_failed":
      return "failed";
    default:
      return "running";
  }
}

export function useJobEvents(
  searchJobId: string | null,
  options: UseJobEventsOptions = {},
) {
  const {
    enabled = true,
    onComplete,
    onFailed,
    onLeadAnalyzed,
    onArtifactReady,
    onEvent,
  } = options;

  const [state, setState] = useState<JobEventsState>(initialState);
  const callbacksRef = useRef({
    onComplete,
    onFailed,
    onLeadAnalyzed,
    onArtifactReady,
    onEvent,
  });

  callbacksRef.current = {
    onComplete,
    onFailed,
    onLeadAnalyzed,
    onArtifactReady,
    onEvent,
  };

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const handleEvent = useCallback((event: SseEvent) => {
    callbacksRef.current.onEvent?.(event);

    setState((prev) => {
      const next: JobEventsState = {
        ...prev,
        lastEvent: event,
        phase: derivePhase(event),
      };

      if (event.type === "progress") {
        next.progressPct = event.payload.progressPct;
        next.totalFound = event.payload.totalFound ?? prev.totalFound;
        next.status = "active";
      }

      if (event.type === "job_completed") {
        next.progressPct = 100;
        next.totalFound = event.payload.totalFound;
        next.status = "completed";
        next.phase = "completed";
      }

      if (event.type === "job_failed") {
        next.status = "failed";
        next.phase = "failed";
        next.errorMessage = event.payload.errorMessage;
      }

      return next;
    });

    if (event.type === "lead_analyzed") {
      callbacksRef.current.onLeadAnalyzed?.(event);
    }

    if (event.type === "artifact_ready") {
      callbacksRef.current.onArtifactReady?.(event);
    }
  }, []);

  useEffect(() => {
    if (!searchJobId || !enabled) {
      return;
    }

    let cancelled = false;
    let terminalNotified = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    };

    const notifyTerminal = (next: JobEventsState) => {
      if (terminalNotified) {
        return;
      }

      if (next.status === "completed") {
        terminalNotified = true;
        stopPolling();
        callbacksRef.current.onComplete?.({
          type: "job_completed",
          payload: {
            searchJobId,
            totalFound: next.totalFound,
          },
        });
      }

      if (next.status === "failed") {
        terminalNotified = true;
        stopPolling();
        callbacksRef.current.onFailed?.({
          type: "job_failed",
          payload: {
            searchJobId,
            errorMessage: next.errorMessage ?? "A busca falhou",
          },
        });
      }
    };

    const syncFromApi = async () => {
      try {
        const response = await fetch(`/api/searches/${searchJobId}`);
        if (!response.ok || cancelled) {
          return;
        }

        const job = (await response.json()) as {
          status: string;
          progressPct: number;
          totalFound: number;
          errorMessage?: string | null;
        };

        if (cancelled) {
          return;
        }

        setState((prev) => {
          if (
            prev.status === "completed" ||
            prev.status === "failed" ||
            isTerminalSseEvent(prev.lastEvent?.type ?? "progress")
          ) {
            return prev;
          }

          const next = stateFromSearchJob(job);
          if (next.status === "completed" || next.status === "failed") {
            notifyTerminal(next);
          }
          return next;
        });
      } catch {
        // Polling/sync errors are non-fatal; SSE may still deliver events.
      }
    };

    setState((prev) => ({
      ...prev,
      status: "connecting",
      phase: "pending",
    }));

    void syncFromApi();

    pollTimer = setInterval(() => {
      void syncFromApi();
    }, 2000);

    const source = new EventSource(`/api/jobs/${searchJobId}/events`);

    const onMessage = (messageEvent: MessageEvent<string>) => {
      try {
        const parsed = sseEventSchema.parse(JSON.parse(messageEvent.data));
        handleEvent(parsed);

        if (parsed.type === "job_completed") {
          notifyTerminal({
            progressPct: 100,
            totalFound: parsed.payload.totalFound,
            phase: "completed",
            status: "completed",
          });
        }

        if (parsed.type === "job_failed") {
          notifyTerminal({
            progressPct: 0,
            totalFound: 0,
            phase: "failed",
            status: "failed",
            errorMessage: parsed.payload.errorMessage,
          });
        }
      } catch {
        // Ignore malformed SSE payloads.
      }
    };

    source.addEventListener("progress", onMessage);
    source.addEventListener("lead_scraped", onMessage);
    source.addEventListener("lead_analyzed", onMessage);
    source.addEventListener("artifact_ready", onMessage);
    source.addEventListener("job_completed", onMessage);
    source.addEventListener("job_failed", onMessage);

    source.onopen = () => {
      setState((prev) => {
        if (prev.status === "completed" || prev.status === "failed") {
          return prev;
        }
        return { ...prev, status: "active" };
      });
    };

    source.onerror = () => {
      if (terminalNotified) {
        return;
      }
      void syncFromApi();
    };

    return () => {
      cancelled = true;
      stopPolling();
      source.close();
    };
  }, [searchJobId, enabled, handleEvent]);

  return { ...state, reset };
}

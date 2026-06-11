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

    if (event.type === "job_completed") {
      callbacksRef.current.onComplete?.(event);
    }

    if (event.type === "job_failed") {
      callbacksRef.current.onFailed?.(event);
    }
  }, []);

  useEffect(() => {
    if (!searchJobId || !enabled) {
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "connecting",
      phase: "pending",
    }));

    const source = new EventSource(`/api/jobs/${searchJobId}/events`);

    const onMessage = (messageEvent: MessageEvent<string>) => {
      try {
        const parsed = sseEventSchema.parse(JSON.parse(messageEvent.data));
        handleEvent(parsed);
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
      setState((prev) => ({ ...prev, status: "active" }));
    };

    source.onerror = () => {
      setState((prev) => {
        if (isTerminalSseEvent(prev.lastEvent?.type ?? "progress")) {
          return prev;
        }

        return {
          ...prev,
          status: "failed",
          phase: "failed",
          errorMessage: "Conexão com o servidor perdida",
        };
      });
      source.close();
    };

    return () => {
      source.close();
    };
  }, [searchJobId, enabled, handleEvent]);

  return { ...state, reset };
}

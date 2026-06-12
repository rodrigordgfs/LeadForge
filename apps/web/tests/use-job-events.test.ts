import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useJobEvents } from "@/hooks/use-job-events";

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void,
  ) {
    const current = this.listeners.get(type) ?? [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  close() {
    // noop
  }

  emit(type: string, payload: unknown) {
    const event = {
      data: JSON.stringify(payload),
    } as MessageEvent<string>;

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("useJobEvents", () => {
  afterEach(() => {
    MockEventSource.instances = [];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mockSearchApi(job: {
    status: string;
    progressPct: number;
    totalFound: number;
    errorMessage?: string | null;
  }) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => job,
      }),
    );
  }

  it("updates progressPct on progress SSE event", async () => {
    mockSearchApi({ status: "running", progressPct: 0, totalFound: 0 });
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    const { result } = renderHook(() => useJobEvents("job_1"));

    await waitFor(() => {
      expect(MockEventSource.instances[0]).toBeDefined();
    });

    act(() => {
      MockEventSource.instances[0]?.onopen?.();
      MockEventSource.instances[0]?.emit("progress", {
        type: "progress",
        payload: { progressPct: 42, totalFound: 3 },
      });
    });

    await waitFor(() => {
      expect(result.current.progressPct).toBe(42);
      expect(result.current.totalFound).toBe(3);
      expect(result.current.status).toBe("active");
    });
  });

  it("calls onComplete callback on job_completed event", async () => {
    mockSearchApi({ status: "running", progressPct: 50, totalFound: 2 });
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    const onComplete = vi.fn();
    renderHook(() =>
      useJobEvents("job_1", {
        onComplete,
      }),
    );

    await waitFor(() => {
      expect(MockEventSource.instances[0]).toBeDefined();
    });

    const completedEvent = {
      type: "job_completed" as const,
      payload: { searchJobId: "job_1", totalFound: 10 },
    };

    act(() => {
      MockEventSource.instances[0]?.emit("job_completed", completedEvent);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(completedEvent);
    });
  });

  it("progress bar reaches 100% when job_completed event received", async () => {
    mockSearchApi({ status: "running", progressPct: 90, totalFound: 4 });
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    const { result } = renderHook(() => useJobEvents("job_1"));

    await waitFor(() => {
      expect(MockEventSource.instances[0]).toBeDefined();
    });

    act(() => {
      MockEventSource.instances[0]?.emit("job_completed", {
        type: "job_completed",
        payload: { searchJobId: "job_1", totalFound: 5 },
      });
    });

    await waitFor(() => {
      expect(result.current.progressPct).toBe(100);
      expect(result.current.status).toBe("completed");
    });
  });

  it("syncs completed state from API when SSE events were missed", async () => {
    mockSearchApi({ status: "completed", progressPct: 100, totalFound: 0 });
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useJobEvents("job_1", {
        onComplete,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("completed");
      expect(result.current.progressPct).toBe(100);
      expect(onComplete).toHaveBeenCalledWith({
        type: "job_completed",
        payload: { searchJobId: "job_1", totalFound: 0 },
      });
    });
  });
});

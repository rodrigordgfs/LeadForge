import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const searchJobFindFirstMock = vi.fn();
const createJobEventsStreamMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    searchJob: {
      findFirst: (...args: unknown[]) => searchJobFindFirstMock(...args),
    },
  },
}));

vi.mock("@/lib/jobs/create-job-events-stream", () => ({
  createJobEventsStream: (...args: unknown[]) =>
    createJobEventsStreamMock(...args),
}));

import { GET as getJobEvents } from "@/app/api/jobs/[id]/events/route";
import {
  formatSseMessage,
  serializeSseEvent,
} from "@leadforge/shared";
import {
  publishSseEvent,
  resetSsePublisherClient,
} from "@leadforge/shared/publisher";

describe("SSE event publisher", () => {
  it("serializes progress event with progressPct field", () => {
    const serialized = serializeSseEvent({
      type: "progress",
      payload: {
        progressPct: 42,
        totalFound: 10,
      },
    });

    expect(JSON.parse(serialized)).toEqual({
      type: "progress",
      payload: {
        progressPct: 42,
        totalFound: 10,
      },
    });
  });

  it("formats SSE data lines with event type prefix", () => {
    const message = formatSseMessage({
      type: "progress",
      payload: { progressPct: 75 },
    });

    expect(message).toContain("event: progress\n");
    expect(message).toContain('"progressPct":75');
    expect(message.endsWith("\n\n")).toBe(true);
  });
});

describe("GET /api/jobs/:id/events route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createJobEventsStreamMock.mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('event: progress\ndata: {"type":"progress"}\n\n'),
          );
        },
      }),
    );
  });

  it("returns Content-Type text/event-stream", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    searchJobFindFirstMock.mockResolvedValue({
      id: "job_1",
      userId: "user_1",
      segmentId: "saude",
      subcategoryId: null,
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
      status: "pending",
      progressPct: 0,
      totalFound: 0,
      errorMessage: null,
      createdAt: new Date(),
      completedAt: null,
      _count: { leads: 0 },
    });

    const response = await getJobEvents(
      new Request("http://localhost/api/jobs/job_1/events"),
      { params: Promise.resolve({ id: "job_1" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(createJobEventsStreamMock).toHaveBeenCalledWith(
      "job_1",
      expect.any(AbortSignal),
    );
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await getJobEvents(
      new Request("http://localhost/api/jobs/job_1/events"),
      { params: Promise.resolve({ id: "job_1" }) },
    );

    expect(response.status).toBe(401);
    expect(createJobEventsStreamMock).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's job", async () => {
    authMock.mockResolvedValue({ userId: "user_2" });
    searchJobFindFirstMock.mockResolvedValue(null);

    const response = await getJobEvents(
      new Request("http://localhost/api/jobs/job_1/events"),
      { params: Promise.resolve({ id: "job_1" }) },
    );

    expect(response.status).toBe(404);
    expect(createJobEventsStreamMock).not.toHaveBeenCalled();
  });
});

const hasRedis = Boolean(process.env.REDIS_URL);

describe.skipIf(!hasRedis)("Job events SSE integration", () => {
  beforeEach(() => {
    resetSsePublisherClient();
  });

  it("publish progress event on Redis channel yields SSE data line", async () => {
    const searchJobId = `job-sse-${Date.now()}`;
    const abortController = new AbortController();
    const stream = (
      await import("@/lib/jobs/create-job-events-stream")
    ).createJobEventsStream(searchJobId, abortController.signal);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const readPromise = reader.read();

    await publishSseEvent(searchJobId, {
      type: "progress",
      payload: {
        progressPct: 50,
        totalFound: 3,
      },
    });

    const { value, done } = await Promise.race([
      readPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timed out waiting for SSE event")), 1000),
      ),
    ]);

    expect(done).toBe(false);
    const chunk = decoder.decode(value);
    expect(chunk).toContain("event: progress");
    expect(chunk).toContain('"progressPct":50');

    abortController.abort();
    await reader.cancel();
    resetSsePublisherClient();
  });

  it("job_completed event closes SSE stream", async () => {
    const searchJobId = `job-done-${Date.now()}`;
    const abortController = new AbortController();
    const stream = (
      await import("@/lib/jobs/create-job-events-stream")
    ).createJobEventsStream(searchJobId, abortController.signal);
    const reader = stream.getReader();

    const readPromise = (async () => {
      const first = await reader.read();
      const second = await reader.read();
      return { first, second };
    })();

    await publishSseEvent(searchJobId, {
      type: "job_completed",
      payload: {
        searchJobId,
        totalFound: 12,
      },
    });

    const { first, second } = await Promise.race([
      readPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timed out waiting for terminal SSE event")), 1000),
      ),
    ]);

    expect(first.done).toBe(false);
    expect(second.done).toBe(true);

    abortController.abort();
    resetSsePublisherClient();
  });
});

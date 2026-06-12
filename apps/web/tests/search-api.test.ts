import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const searchJobCreateMock = vi.fn();
const searchJobFindFirstMock = vi.fn();
const searchJobFindManyMock = vi.fn();
const leadFindManyMock = vi.fn();
const leadCountMock = vi.fn();
const transactionMock = vi.fn();
const enqueueSearchJobMock = vi.fn();
const getSearchQueueMock = vi.fn();
const queueGetJobMock = vi.fn();
const queueJobRemoveMock = vi.fn();
const searchJobDeleteMock = vi.fn();
const markSearchJobCancelledMock = vi.fn();
const cancelSearchQueueJobMock = vi.fn();
const cancelAnalyzeJobsForSearchMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    searchJob: {
      create: (...args: unknown[]) => searchJobCreateMock(...args),
      findFirst: (...args: unknown[]) => searchJobFindFirstMock(...args),
      findMany: (...args: unknown[]) => searchJobFindManyMock(...args),
      findUnique: vi.fn(),
      delete: (...args: unknown[]) => searchJobDeleteMock(...args),
    },
    lead: {
      findMany: (...args: unknown[]) => leadFindManyMock(...args),
      count: (...args: unknown[]) => leadCountMock(...args),
    },
    user: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
  SearchJobStatus: { pending: "pending" },
}));

vi.mock("@leadforge/queue", () => ({
  enqueueSearchJob: (...args: unknown[]) => enqueueSearchJobMock(...args),
  getSearchQueue: (...args: unknown[]) => getSearchQueueMock(...args),
  markSearchJobCancelled: (...args: unknown[]) =>
    markSearchJobCancelledMock(...args),
  cancelSearchQueueJob: (...args: unknown[]) =>
    cancelSearchQueueJobMock(...args),
  cancelAnalyzeJobsForSearch: (...args: unknown[]) =>
    cancelAnalyzeJobsForSearchMock(...args),
  closeSearchQueue: vi.fn(),
  resetRedisConnection: vi.fn(),
}));

import {
  DELETE as deleteSearchById,
  GET as getSearchById,
} from "@/app/api/searches/[id]/route";
import { GET as listSearchesRoute, POST as createSearchRoute } from "@/app/api/searches/route";
import { createSearchJob } from "@/lib/search/create-search-job";
import { deleteSearchJobForUser } from "@/lib/search/delete-search-job";
import { getSearchJobForUser } from "@/lib/search/get-search-job";
import { listSearchLeads } from "@/lib/search/list-search-leads";
import { validateSegmentInput } from "@/lib/search/validate-segment";

describe("validateSegmentInput", () => {
  it("returns null for valid segmentId", () => {
    expect(
      validateSegmentInput({
        segmentId: "saude",
        state: "RS",
        city: "Pelotas",
        radiusKm: 10,
      }),
    ).toBeNull();
  });

  it("returns error for invalid segmentId", () => {
    expect(
      validateSegmentInput({
        segmentId: "invalid-segment",
        state: "RS",
        city: "Pelotas",
        radiusKm: 10,
      }),
    ).toContain("Invalid segmentId");
  });

  it("returns error when subcategory does not belong to segment", () => {
    expect(
      validateSegmentInput({
        segmentId: "saude",
        subcategoryId: "restaurante",
        state: "RS",
        city: "Pelotas",
        radiusKm: 10,
      }),
    ).toContain("Invalid subcategoryId");
  });
});

describe("createSearchJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid segmentId via schema validation", async () => {
    const result = await createSearchJob("user_1", {
      segmentId: "",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("returns 400 for unknown segmentId after schema passes", async () => {
    const result = await createSearchJob("user_1", {
      segmentId: "not-a-real-segment",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Invalid segmentId");
    }
  });

  it("creates search job and enqueues queue job on valid payload", async () => {
    searchJobCreateMock.mockResolvedValue({
      id: "job_123",
      userId: "user_1",
    });
    enqueueSearchJobMock.mockResolvedValue("job_123");

    const result = await createSearchJob("user_1", {
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.searchJobId).toBe("job_123");
    }

    expect(searchJobCreateMock).toHaveBeenCalledOnce();
    expect(enqueueSearchJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchJobId: "job_123",
        userId: "user_1",
        segmentId: "saude",
      }),
      "job_123",
    );
  });
});

describe("getSearchJobForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when job belongs to another user", async () => {
    searchJobFindFirstMock.mockResolvedValue(null);

    const result = await getSearchJobForUser("user_2", "job_1");

    expect(result).toBeNull();
  });
});

describe("listSearchLeads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns leads sorted by score ascending with nulls last", async () => {
    searchJobFindFirstMock.mockResolvedValue({ id: "job_1" });
    leadFindManyMock.mockResolvedValue([
      { id: "lead_1", score: 30 },
      { id: "lead_2", score: 55 },
      { id: "lead_3", score: null },
    ]);
    leadCountMock.mockResolvedValue(3);
    transactionMock.mockImplementation((ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );

    const result = await listSearchLeads({
      userId: "user_1",
      searchJobId: "job_1",
    });

    expect(result).not.toBeNull();
    expect(result?.total).toBe(3);
    expect(leadFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ id: true, name: true }),
        orderBy: { score: { sort: "asc", nulls: "last" } },
      }),
    );
  });
});

describe("POST /api/searches route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await createSearchRoute(
      new Request("http://localhost/api/searches", {
        method: "POST",
        body: JSON.stringify({
          segmentId: "saude",
          state: "RS",
          city: "Pelotas",
          radiusKm: 10,
        }),
      }),
    );

    expect(response.status).toBe(401);
  });
});

describe("GET /api/searches route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent searches for the authenticated user", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    searchJobFindManyMock.mockResolvedValue([
      {
        id: "job_1",
        segmentId: "saude",
        subcategoryId: null,
        city: "Pelotas",
        state: "RS",
        radiusKm: 10,
        status: "completed",
        progressPct: 100,
        totalFound: 5,
        errorMessage: null,
        createdAt: new Date("2026-06-11T12:00:00.000Z"),
        completedAt: new Date("2026-06-11T12:30:00.000Z"),
        _count: { leads: 5 },
      },
    ]);

    const response = await listSearchesRoute();
    const data = (await response.json()) as {
      searches: Array<{ id: string; segmentName: string; leadCount: number }>;
    };

    expect(response.status).toBe(200);
    expect(data.searches).toHaveLength(1);
    expect(data.searches[0]?.id).toBe("job_1");
    expect(data.searches[0]?.segmentName).toBe("Saúde");
    expect(data.searches[0]?.leadCount).toBe(5);
    expect(searchJobFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});

describe("deleteSearchJobForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markSearchJobCancelledMock.mockResolvedValue(undefined);
    cancelSearchQueueJobMock.mockResolvedValue(undefined);
    cancelAnalyzeJobsForSearchMock.mockResolvedValue(undefined);
    searchJobDeleteMock.mockResolvedValue({});
  });

  it("cancels in-flight work and deletes search when owned by user", async () => {
    searchJobFindFirstMock.mockResolvedValue({
      id: "job_1",
      status: "running",
    });

    const deleted = await deleteSearchJobForUser("user_1", "job_1");

    expect(deleted).toBe(true);
    expect(markSearchJobCancelledMock).toHaveBeenCalledWith("job_1");
    expect(cancelSearchQueueJobMock).toHaveBeenCalledWith("job_1");
    expect(cancelAnalyzeJobsForSearchMock).toHaveBeenCalledWith("job_1");
    expect(searchJobDeleteMock).toHaveBeenCalledWith({
      where: { id: "job_1" },
    });
  });

  it("returns false when search does not belong to user", async () => {
    searchJobFindFirstMock.mockResolvedValue(null);

    const deleted = await deleteSearchJobForUser("user_2", "job_1");

    expect(deleted).toBe(false);
    expect(searchJobDeleteMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/searches/:id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for another user's job", async () => {
    authMock.mockResolvedValue({ userId: "user_2" });
    searchJobFindFirstMock.mockResolvedValue(null);

    const response = await getSearchById(
      new Request("http://localhost/api/searches/job_1"),
      { params: Promise.resolve({ id: "job_1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("DELETE returns 204 when search is deleted", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    searchJobFindFirstMock.mockResolvedValue({
      id: "job_1",
      status: "running",
    });
    markSearchJobCancelledMock.mockResolvedValue(undefined);
    cancelSearchQueueJobMock.mockResolvedValue(undefined);
    cancelAnalyzeJobsForSearchMock.mockResolvedValue(undefined);
    searchJobDeleteMock.mockResolvedValue({});

    const response = await deleteSearchById(
      new Request("http://localhost/api/searches/job_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "job_1" }) },
    );

    expect(response.status).toBe(204);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasRedis = Boolean(process.env.REDIS_URL);

describe.skipIf(!hasDatabase || !hasRedis)("Search API integration", () => {
  it("POST search creates SearchJob row with status pending in database", async () => {
    const { prisma, SearchJobStatus } = await import("@leadforge/db");

    const userId = `test-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Integration User",
        email: `integration-${Date.now()}@example.com`,
      },
    });

    const result = await createSearchJob(userId, {
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const job = await prisma.searchJob.findUnique({
      where: { id: result.data.searchJobId },
    });

    expect(job?.status).toBe(SearchJobStatus.pending);
    expect(job?.userId).toBe(userId);

    await prisma.searchJob.delete({ where: { id: result.data.searchJobId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("POST search enqueues BullMQ job with matching searchJobId", async () => {
    const { prisma } = await import("@leadforge/db");
    const { getSearchQueue, closeSearchQueue, resetRedisConnection } =
      await import("@leadforge/queue");

    const userId = `test-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Queue User",
        email: `queue-${Date.now()}@example.com`,
      },
    });

    const result = await createSearchJob(userId, {
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const job = await getSearchQueue().getJob(result.data.searchJobId);
    expect(job?.data.searchJobId).toBe(result.data.searchJobId);

    await job?.remove();
    await prisma.searchJob.delete({ where: { id: result.data.searchJobId } });
    await prisma.user.delete({ where: { id: userId } });
    await closeSearchQueue();
    resetRedisConnection();
  });

  it("GET leads returns empty array for new search with zero scraped leads", async () => {
    const { prisma } = await import("@leadforge/db");

    const userId = `test-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Leads User",
        email: `leads-${Date.now()}@example.com`,
      },
    });

    const searchJob = await prisma.searchJob.create({
      data: {
        userId,
        segmentId: "saude",
        state: "RS",
        city: "Pelotas",
      },
    });

    const result = await listSearchLeads({
      userId,
      searchJobId: searchJob.id,
    });

    expect(result?.leads).toEqual([]);
    expect(result?.total).toBe(0);

    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: userId } });
  });
});

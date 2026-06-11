import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const searchJobCreateMock = vi.fn();
const searchJobFindFirstMock = vi.fn();
const leadFindManyMock = vi.fn();
const leadCountMock = vi.fn();
const transactionMock = vi.fn();
const enqueueSearchJobMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    searchJob: {
      create: (...args: unknown[]) => searchJobCreateMock(...args),
      findFirst: (...args: unknown[]) => searchJobFindFirstMock(...args),
      findUnique: vi.fn(),
      delete: vi.fn(),
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
  getSearchQueue: vi.fn(),
  closeSearchQueue: vi.fn(),
  resetRedisConnection: vi.fn(),
}));

import { GET as getSearchById } from "@/app/api/searches/[id]/route";
import { POST as createSearchRoute } from "@/app/api/searches/route";
import { createSearchJob } from "@/lib/search/create-search-job";
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

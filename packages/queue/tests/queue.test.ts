import { describe, expect, it } from "vitest";
import {
  DEFAULT_JOB_OPTIONS,
  analyzeJobPayloadSchema,
  searchJobPayloadSchema,
} from "../src/types.js";
import { createRedisConnectionOptions } from "../src/connection.js";

describe("job payload schemas", () => {
  it("rejects SearchJobPayload missing searchJobId", () => {
    const result = searchJobPayloadSchema.safeParse({
      userId: "user_1",
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.success).toBe(false);
  });

  it("requires leadId and userId on AnalyzeJobPayload", () => {
    const missingLead = analyzeJobPayloadSchema.safeParse({
      userId: "user_1",
      searchJobId: "job_1",
    });
    const missingUser = analyzeJobPayloadSchema.safeParse({
      leadId: "lead_1",
      searchJobId: "job_1",
    });
    const valid = analyzeJobPayloadSchema.safeParse({
      leadId: "lead_1",
      userId: "user_1",
      searchJobId: "job_1",
    });

    expect(missingLead.success).toBe(false);
    expect(missingUser.success).toBe(false);
    expect(valid.success).toBe(true);
  });
});

describe("queue defaults", () => {
  it("includes attempts=3 with exponential backoff", () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3);
    expect(DEFAULT_JOB_OPTIONS.backoff).toEqual({
      type: "exponential",
      delay: 1000,
    });
  });
});

describe("redis connection", () => {
  it("throws when REDIS_URL is invalid", () => {
    expect(() =>
      createRedisConnectionOptions("not-a-valid-redis-url"),
    ).toThrow(/Invalid environment configuration/);
  });
});

const hasRedis = Boolean(process.env.REDIS_URL);

describe.skipIf(!hasRedis)("Redis integration", () => {
  it("enqueues search job and retrieves it by ID", async () => {
    const { enqueueSearchJob, getSearchQueue, closeSearchQueue } =
      await import("../src/queues/search.js");
    const { resetRedisConnection } = await import("../src/connection.js");

    const jobId = `search-test-${Date.now()}`;
    const payload = {
      searchJobId: "job_search_1",
      userId: "user_1",
      segmentId: "saude",
      subcategoryId: "dentista",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    };

    await enqueueSearchJob(payload, jobId);
    const job = await getSearchQueue().getJob(jobId);

    expect(job).not.toBeNull();
    expect(job?.data).toEqual(payload);

    await job?.remove();
    await closeSearchQueue();
    resetRedisConnection();
  });

  it("enqueues analyze job after search job without payload corruption", async () => {
    const { enqueueAnalyzeJob, closeAnalyzeQueue } = await import(
      "../src/queues/analyze.js"
    );
    const { resetRedisConnection } = await import("../src/connection.js");

    const jobId = `analyze-test-${Date.now()}`;
    const payload = {
      leadId: "lead_1",
      userId: "user_1",
      searchJobId: "job_search_1",
    };

    await enqueueAnalyzeJob(payload, jobId);
    const queue = (await import("../src/queues/analyze.js")).getAnalyzeQueue();
    const job = await queue.getJob(jobId);

    expect(job?.data).toEqual(payload);

    await job?.remove();
    await closeAnalyzeQueue();
    resetRedisConnection();
  });
});

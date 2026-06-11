import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPsiClient,
  parsePsiResponse,
  resetPsiDailyCounter,
  getPsiDailyCallCount,
} from "../src/audit/psi-client.js";
import {
  MOCK_PSI_RESPONSE,
  createMockPsiFetch,
} from "../src/audit/psi-mock.js";

describe("psi client", () => {
  afterEach(() => {
    resetPsiDailyCounter();
    vi.restoreAllMocks();
  });

  it("parses performanceScore from mock v5 response JSON", () => {
    const metrics = parsePsiResponse(MOCK_PSI_RESPONSE);
    expect(metrics).toEqual({
      performanceScore: 72,
      lcp: 2.8,
      cls: 0.12,
      seoScore: 81,
    });
  });

  it("retries twice then returns null on persistent 500 error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("error", { status: 500 }));
    const client = createPsiClient(fetchMock, "test-key");

    const result = await client.fetchMetrics("https://example.com");
    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("increments daily PSI call counter", async () => {
    const client = createPsiClient(createMockPsiFetch(), "test-key");
    await client.fetchMetrics("https://example.com");
    expect(getPsiDailyCallCount()).toBe(1);
  });
});

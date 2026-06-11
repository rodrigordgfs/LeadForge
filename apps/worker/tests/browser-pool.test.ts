import { afterEach, describe, expect, it } from "vitest";
import { BrowserPool } from "../src/scraper/browser-pool.js";
import { BrowserPoolExhaustedError } from "../src/scraper/errors.js";
import { createMockBrowser } from "./helpers/mock-page.js";

describe("BrowserPool", () => {
  let pool: BrowserPool;

  afterEach(async () => {
    await pool?.close();
  });

  it("rejects third concurrent context when SCRAPER_CONCURRENCY=2", async () => {
    pool = new BrowserPool({
      maxConcurrency: 2,
      launchBrowser: async () => createMockBrowser("<html></html>"),
    });

    const first = await pool.acquireContext();
    const second = await pool.acquireContext();

    expect(pool.activeCount).toBe(2);

    await expect(pool.acquireContext({ wait: false })).rejects.toBeInstanceOf(
      BrowserPoolExhaustedError,
    );

    await pool.releaseContext(first);
    await pool.releaseContext(second);
  });

  it("allows acquisition after a context is released", async () => {
    pool = new BrowserPool({
      maxConcurrency: 2,
      launchBrowser: async () => createMockBrowser("<html></html>"),
    });

    const first = await pool.acquireContext();
    const second = await pool.acquireContext();
    await pool.releaseContext(first);

    const third = await pool.acquireContext({ wait: false });
    expect(third).toBeDefined();

    await pool.releaseContext(second);
    await pool.releaseContext(third);
  });
});

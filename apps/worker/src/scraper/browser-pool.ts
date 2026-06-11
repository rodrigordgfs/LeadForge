import { chromium, type Browser, type BrowserContext } from "playwright";
import { BrowserPoolExhaustedError } from "./errors.js";

export interface BrowserPoolOptions {
  maxConcurrency?: number;
  launchBrowser?: () => Promise<Browser>;
}

export class BrowserPool {
  private browser: Browser | null = null;
  private activeContexts = 0;
  private readonly maxConcurrency: number;
  private readonly waitQueue: Array<() => void> = [];
  private readonly launchBrowser: () => Promise<Browser>;

  constructor(options: BrowserPoolOptions = {}) {
    this.maxConcurrency =
      options.maxConcurrency ??
      Number.parseInt(process.env.SCRAPER_CONCURRENCY ?? "2", 10);
    this.launchBrowser = options.launchBrowser ?? (() => chromium.launch({ headless: true }));
  }

  get concurrencyLimit(): number {
    return this.maxConcurrency;
  }

  get activeCount(): number {
    return this.activeContexts;
  }

  async acquireContext(options?: { wait?: boolean }): Promise<BrowserContext> {
    if (this.activeContexts >= this.maxConcurrency) {
      if (options?.wait === false) {
        throw new BrowserPoolExhaustedError(this.maxConcurrency);
      }
      await this.waitForSlot();
    }

    if (!this.browser) {
      this.browser = await this.launchBrowser();
    }

    this.activeContexts += 1;
    return this.browser.newContext();
  }

  async releaseContext(context: BrowserContext): Promise<void> {
    await context.close();
    this.activeContexts -= 1;
    this.notifyWaiter();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.activeContexts = 0;
    this.waitQueue.length = 0;
  }

  private waitForSlot(): Promise<void> {
    if (this.activeContexts < this.maxConcurrency) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  private notifyWaiter(): void {
    const next = this.waitQueue.shift();
    next?.();
  }
}

export const SCRAPER_CONCURRENCY = Number.parseInt(
  process.env.SCRAPER_CONCURRENCY ?? "2",
  10,
);

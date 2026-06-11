import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PlaywrightSiteAuditor,
  buildProblemsAndOpportunities,
} from "../src/audit/playwright-auditor.js";
import { BrowserPool } from "../src/scraper/browser-pool.js";
import { createMockBrowser, createMockPage } from "./helpers/mock-page.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sslFixture = path.resolve(__dirname, "../fixtures/site-with-ssl.html");
const noViewportFixture = path.resolve(__dirname, "../fixtures/site-no-viewport.html");

async function createAuditorFromFixture(fixturePath: string): Promise<PlaywrightSiteAuditor> {
  const html = await readFile(fixturePath, "utf8");
  const browserPool = new BrowserPool({
    maxConcurrency: 1,
    launchBrowser: async () => createMockBrowser(html),
  });

  return new PlaywrightSiteAuditor({
    browserPool,
    ownsBrowserPool: true,
  });
}

describe("PlaywrightSiteAuditor", () => {
  it("audits local HTTPS fixture with sslValid=true", async () => {
    const auditor = await createAuditorFromFixture(sslFixture);
    const result = await auditor.audit(`file://${sslFixture}`);

    expect(result.sslValid).toBe(true);
    expect(result.seoBasics.title).toBe(true);
    expect(result.seoBasics.metaDescription).toBe(true);
    expect(result.seoBasics.h1).toBe(true);
  });

  it("fails mobile viewport check when viewport meta is absent", async () => {
    const auditor = await createAuditorFromFixture(noViewportFixture);
    const result = await auditor.audit(`file://${noViewportFixture}`);

    expect(result.mobileResponsive).toBe(false);
    expect(result.problems).toContain("Site não responsivo em dispositivos móveis");
  });

  it("adds SEO inexistente when fixture has no h1", () => {
    const problems = buildProblemsAndOpportunities({
      hasRealWebsite: true,
      sslValid: true,
      mobileResponsive: true,
      ownDomain: true,
      seoBasics: {
        title: false,
        metaDescription: false,
        h1: false,
      },
    });

    expect(problems.problems).toContain("SEO inexistente");
  });

  it("returns partial result with timeout problem", async () => {
    const page = createMockPage("<html><body></body></html>");
    const timeoutPage = {
      ...page,
      goto: async () => {
        throw new Error("Timeout 15000ms exceeded");
      },
    };

    const browserPool = new BrowserPool({
      maxConcurrency: 1,
      launchBrowser: async () =>
        ({
          newContext: async () => ({
            newPage: async () => timeoutPage,
            close: async () => undefined,
          }),
          close: async () => undefined,
        }) as never,
    });

    const auditor = new PlaywrightSiteAuditor({
      browserPool,
      ownsBrowserPool: true,
    });

    const result = await auditor.audit("https://slow.example.com");
    expect(result.problems.some((problem) => problem.includes("Timeout"))).toBe(
      true,
    );
  });

  it("classifies instagram profile as not real website", async () => {
    const auditor = new PlaywrightSiteAuditor();
    const result = await auditor.audit("https://instagram.com/loja");

    expect(result.hasRealWebsite).toBe(false);
    expect(result.problems[0]).toContain("rede social");
  });
});

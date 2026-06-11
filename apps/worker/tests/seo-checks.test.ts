import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkSeoBasics } from "../src/audit/seo-checks.js";
import { createMockPage } from "./helpers/mock-page.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, "../fixtures/site-no-viewport.html");

describe("seo checks", () => {
  it("detects missing meta description in fixture", async () => {
    const page = createMockPage(
      `<!doctype html><html><head><title>Teste</title></head><body><h1>Olá</h1></body></html>`,
    );

    const result = await checkSeoBasics(page);
    expect(result.title).toBe(true);
    expect(result.metaDescription).toBe(false);
    expect(result.h1).toBe(true);
  });

  it("reads SEO basics from local fixture file", async () => {
    const html = await readFile(fixturePath, "utf8");
    const page = createMockPage(html);

    const result = await checkSeoBasics(page);
    expect(result.title).toBe(true);
    expect(result.metaDescription).toBe(true);
    expect(result.h1).toBe(true);
  });
});

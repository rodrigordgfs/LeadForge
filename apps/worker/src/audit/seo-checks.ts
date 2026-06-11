import type { Page } from "playwright";

export interface SeoBasicsResult {
  title: boolean;
  metaDescription: boolean;
  h1: boolean;
}

export async function checkSeoBasics(page: Page): Promise<SeoBasicsResult> {
  return page.evaluate(() => {
    const title = Boolean(document.title?.trim());
    const metaDescription = Boolean(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim(),
    );
    const h1 = Boolean(document.querySelector("h1")?.textContent?.trim());

    return { title, metaDescription, h1 };
  });
}

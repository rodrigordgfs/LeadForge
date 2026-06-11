import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { SiteAuditResult, SiteAuditor } from "@leadforge/shared";
import type { Page } from "playwright";
import { BrowserPool } from "../scraper/browser-pool.js";
import { checkSeoBasics } from "./seo-checks.js";
import { classifyUrl, normalizeUrl } from "./url-classifier.js";

const NAVIGATION_TIMEOUT_MS = 15_000;
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

export interface PlaywrightSiteAuditorOptions {
  browserPool?: BrowserPool;
  timeoutMs?: number;
  ownsBrowserPool?: boolean;
}

function buildSocialOnlyResult(): SiteAuditResult {
  return {
    hasRealWebsite: false,
    sslValid: false,
    mobileResponsive: false,
    ownDomain: false,
    seoBasics: {
      title: false,
      metaDescription: false,
      h1: false,
    },
    problems: ["URL aponta para rede social ou link agregador, sem site próprio"],
    opportunities: ["Criar site institucional", "Presença digital profissional"],
  };
}

export function buildProblemsAndOpportunities(
  audit: Omit<SiteAuditResult, "problems" | "opportunities">,
): Pick<SiteAuditResult, "problems" | "opportunities"> {
  const problems: string[] = [];
  const opportunities: string[] = [];

  if (!audit.sslValid) {
    problems.push("Site sem certificado SSL válido");
    opportunities.push("Implementar HTTPS com certificado válido");
  }

  if (!audit.mobileResponsive) {
    problems.push("Site não responsivo em dispositivos móveis");
    opportunities.push("Redesign responsivo para mobile");
  }

  const seoChecks = [
    audit.seoBasics.title,
    audit.seoBasics.metaDescription,
    audit.seoBasics.h1,
  ];
  const seoPassed = seoChecks.filter(Boolean).length;

  if (seoPassed === 0) {
    problems.push("SEO inexistente");
  } else if (seoPassed < seoChecks.length) {
    problems.push("SEO básico incompleto");
  }

  if (!audit.seoBasics.metaDescription) {
    opportunities.push("Adicionar meta description otimizada");
  }

  if (!audit.seoBasics.h1) {
    opportunities.push("Estruturar conteúdo com título H1");
  }

  if (!audit.ownDomain) {
    problems.push("Domínio de terceiros ou subdomínio genérico");
    opportunities.push("Migrar para domínio próprio");
  }

  if (problems.length === 0) {
    opportunities.push("Otimização contínua de performance e SEO");
  }

  return { problems, opportunities };
}

async function checkMobileResponsive(page: Page): Promise<boolean> {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 8,
  );

  await page.setViewportSize(MOBILE_VIEWPORT);
  const hasViewportMeta = await page.evaluate(() =>
    Boolean(
      document.querySelector('meta[name="viewport"]')?.getAttribute("content"),
    ),
  );

  const mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 8,
  );

  return hasViewportMeta && !desktopOverflow && !mobileOverflow;
}

async function navigateWithTimeout(
  page: Page,
  url: string,
  timeoutMs: number,
): Promise<{ sslValid: boolean; unreachable: boolean; timedOut: boolean }> {
  if (url.startsWith("file://")) {
    const filePath = fileURLToPath(url);
    const html = await readFile(filePath, "utf8");
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    return { sslValid: true, unreachable: false, timedOut: false };
  }

  const httpsUrl = url.startsWith("http://")
    ? url.replace(/^http:\/\//, "https://")
    : url;

  try {
    const response = await page.goto(httpsUrl, {
      timeout: timeoutMs,
      waitUntil: "domcontentloaded",
    });

    if (!response) {
      return { sslValid: false, unreachable: true, timedOut: false };
    }

    return {
      sslValid: httpsUrl.startsWith("https://") && response.ok(),
      unreachable: !response.ok(),
      timedOut: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("timeout")) {
      return { sslValid: false, unreachable: true, timedOut: true };
    }

    return { sslValid: false, unreachable: true, timedOut: false };
  }
}

export class PlaywrightSiteAuditor implements SiteAuditor {
  private readonly browserPool: BrowserPool;
  private readonly timeoutMs: number;
  private readonly ownsBrowserPool: boolean;

  constructor(options: PlaywrightSiteAuditorOptions = {}) {
    this.browserPool = options.browserPool ?? new BrowserPool({ maxConcurrency: 1 });
    this.timeoutMs = options.timeoutMs ?? NAVIGATION_TIMEOUT_MS;
    this.ownsBrowserPool = options.ownsBrowserPool ?? !options.browserPool;
  }

  async audit(url: string): Promise<SiteAuditResult> {
    const normalizedUrl = normalizeUrl(url);
    const classification = classifyUrl(normalizedUrl);

    if (!classification.hasRealWebsite) {
      return buildSocialOnlyResult();
    }

    const context = await this.browserPool.acquireContext();
    const page = await context.newPage();

    try {
      const navigation = await navigateWithTimeout(
        page,
        classification.normalizedUrl,
        this.timeoutMs,
      );

      if (navigation.unreachable && !navigation.timedOut) {
        const base: Omit<SiteAuditResult, "problems" | "opportunities"> = {
          hasRealWebsite: true,
          sslValid: false,
          mobileResponsive: false,
          ownDomain: classification.ownDomain,
          seoBasics: {
            title: false,
            metaDescription: false,
            h1: false,
          },
        };

        return {
          ...base,
          problems: ["URL inacessível ou não responde"],
          opportunities: ["Criar site acessível e estável"],
        };
      }

      const seoBasics = navigation.timedOut
        ? { title: false, metaDescription: false, h1: false }
        : await checkSeoBasics(page);

      const mobileResponsive = navigation.timedOut
        ? false
        : await checkMobileResponsive(page);

      const base: Omit<SiteAuditResult, "problems" | "opportunities"> = {
        hasRealWebsite: true,
        sslValid: navigation.sslValid,
        mobileResponsive,
        ownDomain: classification.ownDomain,
        seoBasics,
      };

      const derived = buildProblemsAndOpportunities(base);
      const problems = [...derived.problems];

      if (navigation.timedOut) {
        problems.push("Timeout na navegação do site");
      }

      return {
        ...base,
        problems,
        opportunities: derived.opportunities,
      };
    } finally {
      await page.close();
      await this.browserPool.releaseContext(context);

      if (this.ownsBrowserPool) {
        await this.browserPool.close();
      }
    }
  }
}

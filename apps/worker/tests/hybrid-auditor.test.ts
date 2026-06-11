import { describe, expect, it, vi } from "vitest";
import type { SiteAuditResult } from "@leadforge/shared";
import {
  HybridSiteAuditor,
  mergeAuditResults,
} from "../src/audit/hybrid-auditor.js";
import { createMockPsiClient } from "../src/audit/psi-mock.js";

const phaseA: SiteAuditResult = {
  hasRealWebsite: true,
  sslValid: true,
  mobileResponsive: true,
  ownDomain: true,
  seoBasics: {
    title: true,
    metaDescription: true,
    h1: true,
  },
  problems: [],
  opportunities: ["SEO local"],
};

describe("hybrid auditor", () => {
  it("mergeAuditResults adds psi field when PSI data available", () => {
    const merged = mergeAuditResults(phaseA, {
      performanceScore: 70,
      lcp: 2.5,
      cls: 0.1,
      seoScore: 80,
    });

    expect(merged.psi).toEqual({
      performanceScore: 70,
      lcp: 2.5,
      cls: 0.1,
      seoScore: 80,
    });
    expect(merged.psi_available).toBe(true);
  });

  it("mergeAuditResults sets psi_available=false when PSI returns null", () => {
    const merged = mergeAuditResults(phaseA, null);
    expect(merged.psi).toBeUndefined();
    expect(merged.psi_available).toBe(false);
  });

  it("skips PSI when Phase A reports unreachable URL", async () => {
    const fetchMetrics = vi.fn();
    const playwrightAuditor = {
      audit: async () => ({
        ...phaseA,
        problems: ["URL inacessível ou não responde"],
      }),
    };

    const auditor = new HybridSiteAuditor({
      playwrightAuditor,
      psiClient: { fetchMetrics },
    });

    const result = await auditor.audit("https://example.com");
    expect(fetchMetrics).not.toHaveBeenCalled();
    expect(result.psi).toBeUndefined();
  });

  it("returns complete SiteAuditResult with psi block using mock PSI", async () => {
    const playwrightAuditor = {
      audit: async () => phaseA,
    };

    const auditor = new HybridSiteAuditor({
      playwrightAuditor,
      psiClient: createMockPsiClient(),
    });

    const result = await auditor.audit("https://example.com");
    expect(result.psi?.performanceScore).toBe(72);
  });

  it("fallback path produces valid audit without psi field", async () => {
    const playwrightAuditor = {
      audit: async () => phaseA,
    };

    const auditor = new HybridSiteAuditor({
      playwrightAuditor,
      psiClient: createMockPsiClient(null),
    });

    const result = await auditor.audit("https://example.com");
    expect(result.psi).toBeUndefined();
    expect(result.hasRealWebsite).toBe(true);
  });
});

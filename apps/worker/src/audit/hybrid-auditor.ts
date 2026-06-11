import type { SiteAuditResult, SiteAuditor } from "@leadforge/shared";
import { PlaywrightSiteAuditor } from "./playwright-auditor.js";
import type { PsiClient, PsiMetrics } from "./psi-client.js";
import { createPsiClient } from "./psi-client.js";

export interface MergedAuditResult extends SiteAuditResult {
  psi_available: boolean;
}

export function isUrlUnreachableInPhaseA(audit: SiteAuditResult): boolean {
  return audit.problems.some(
    (problem) =>
      problem.includes("inacessível") ||
      problem.includes("Timeout na navegação"),
  );
}

export function mergeAuditResults(
  phaseA: SiteAuditResult,
  psi: PsiMetrics | null,
): MergedAuditResult {
  if (!psi) {
    return {
      ...phaseA,
      psi_available: false,
    };
  }

  return {
    ...phaseA,
    psi: {
      performanceScore: psi.performanceScore,
      lcp: psi.lcp,
      cls: psi.cls,
      seoScore: psi.seoScore,
    },
    psi_available: true,
  };
}

export interface HybridSiteAuditorOptions {
  playwrightAuditor?: SiteAuditor;
  psiClient?: PsiClient;
}

export class HybridSiteAuditor implements SiteAuditor {
  private readonly playwrightAuditor: SiteAuditor;
  private readonly psiClient: PsiClient;

  constructor(options: HybridSiteAuditorOptions = {}) {
    this.playwrightAuditor =
      options.playwrightAuditor ?? new PlaywrightSiteAuditor();
    this.psiClient = options.psiClient ?? createPsiClient();
  }

  async audit(url: string): Promise<SiteAuditResult> {
    const phaseA = await this.playwrightAuditor.audit(url);

    if (!phaseA.hasRealWebsite || isUrlUnreachableInPhaseA(phaseA)) {
      return mergeAuditResults(phaseA, null);
    }

    const psi = await this.psiClient.fetchMetrics(url);
    return mergeAuditResults(phaseA, psi);
  }

  async auditWithMeta(url: string): Promise<MergedAuditResult> {
    const result = await this.audit(url);
    return {
      ...result,
      psi_available: Boolean(result.psi),
    };
  }
}

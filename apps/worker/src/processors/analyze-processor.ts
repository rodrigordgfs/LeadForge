import { prisma, type Prisma } from "@leadforge/db";
import type { AnalyzeJobPayload } from "@leadforge/queue";
import { publishSseEvent } from "@leadforge/shared";
import type { Job } from "bullmq";
import { HybridSiteAuditor } from "../audit/hybrid-auditor.js";
import type { MergedAuditResult } from "../audit/hybrid-auditor.js";
import { maybeTriggerArtifactsPipeline } from "../services/pipeline-trigger.js";
import { scoreLeadFromAudit } from "../services/score-lead.js";

export interface AnalyzeProcessorDeps {
  auditor?: HybridSiteAuditor;
  publishEvent?: typeof publishSseEvent;
  triggerPipeline?: typeof maybeTriggerArtifactsPipeline;
}

function buildNoWebsiteAudit(): MergedAuditResult {
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
    problems: ["Empresa sem website"],
    opportunities: ["Criar site institucional", "Presença digital profissional"],
    psi_available: false,
  };
}

export async function processAnalyzeJob(
  payload: AnalyzeJobPayload,
  deps: AnalyzeProcessorDeps = {},
): Promise<void> {
  const publishEvent = deps.publishEvent ?? publishSseEvent;
  const triggerPipeline = deps.triggerPipeline ?? maybeTriggerArtifactsPipeline;
  const auditor = deps.auditor ?? new HybridSiteAuditor();
  const { leadId, userId, searchJobId } = payload;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const audit = lead.website
    ? await auditor.auditWithMeta(lead.website)
    : buildNoWebsiteAudit();

  const scored = scoreLeadFromAudit(lead, audit);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: scored.score,
      scoreBand: scored.scoreBand,
      hasRealWebsite: scored.hasRealWebsite,
      diagnosisJson: scored.diagnosisJson as unknown as Prisma.InputJsonValue,
      diagnosedAt: new Date(),
    },
  });

  const pipeline = await triggerPipeline(
    leadId,
    userId,
    scored.score,
    scored.hasRealWebsite,
  );

  await publishEvent(searchJobId, {
    type: "lead_analyzed",
    payload: {
      leadId,
      score: scored.score,
      scoreBand: scored.scoreBand,
      hasRealWebsite: scored.hasRealWebsite,
      autoPipelineTriggered: pipeline.triggered,
    },
  });
}

export function createAnalyzeProcessorHandler(deps: AnalyzeProcessorDeps = {}) {
  return async (job: Job<AnalyzeJobPayload>) => {
    await processAnalyzeJob(job.data, deps);
  };
}

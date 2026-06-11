import { prisma } from "@leadforge/db";
import { enqueueArtifactsJob } from "@leadforge/queue";
import {
  DEFAULT_HIGH_OPPORTUNITY_THRESHOLD,
  isHighOpportunity,
} from "@leadforge/shared";

export interface PipelineTriggerResult {
  triggered: boolean;
  threshold: number;
}

export async function getUserHighOpportunityThreshold(
  userId: string,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settingsJson: true },
  });

  const settings = (user?.settingsJson ?? {}) as Record<string, unknown>;
  const threshold = settings.highOpportunityThreshold;

  if (typeof threshold === "number" && Number.isFinite(threshold)) {
    return threshold;
  }

  return DEFAULT_HIGH_OPPORTUNITY_THRESHOLD;
}

export async function maybeTriggerArtifactsPipeline(
  leadId: string,
  userId: string,
  score: number,
  hasRealWebsite: boolean,
  enqueueArtifacts: typeof enqueueArtifactsJob = enqueueArtifactsJob,
): Promise<PipelineTriggerResult> {
  const threshold = await getUserHighOpportunityThreshold(userId);
  const triggered = isHighOpportunity(score, hasRealWebsite, threshold);

  if (triggered) {
    await enqueueArtifacts({ leadId, userId });
    await prisma.lead.update({
      where: { id: leadId },
      data: { autoPipelineTriggered: true },
    });
  }

  return { triggered, threshold };
}

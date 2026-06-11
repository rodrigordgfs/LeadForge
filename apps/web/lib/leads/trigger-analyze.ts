import { enqueueAnalyzeJob } from "@leadforge/queue";

import { getLeadForUser } from "@/lib/leads/get-lead-for-user";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type TriggerAnalyzeResult =
  | { ok: true; jobId: string }
  | { ok: false; status: number; message: string };

export async function triggerLeadAnalyze(
  userId: string,
  leadId: string,
  options: { force?: boolean } = {},
): Promise<TriggerAnalyzeResult> {
  const lead = await getLeadForUser(userId, leadId);

  if (!lead) {
    return { ok: false, status: 404, message: "Lead not found" };
  }

  if (
    !options.force &&
    lead.diagnosedAt &&
    Date.now() - lead.diagnosedAt.getTime() < COOLDOWN_MS
  ) {
    return {
      ok: false,
      status: 429,
      message: "Lead was diagnosed within the last 24 hours",
    };
  }

  const jobId = await enqueueAnalyzeJob(
    {
      leadId: lead.id,
      userId: lead.userId,
      searchJobId: lead.searchJobId,
    },
    `analyze-${lead.id}-${Date.now()}`,
  );

  return { ok: true, jobId };
}

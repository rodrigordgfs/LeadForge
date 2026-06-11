import { enqueueArtifactsJob } from "@leadforge/queue";

import { getLeadForUser } from "@/lib/leads/get-lead-for-user";

export type TriggerArtifactsResult =
  | { ok: true; jobId: string }
  | { ok: false; status: number; message: string };

export async function triggerLeadArtifacts(
  userId: string,
  leadId: string,
): Promise<TriggerArtifactsResult> {
  const lead = await getLeadForUser(userId, leadId);

  if (!lead) {
    return { ok: false, status: 404, message: "Lead not found" };
  }

  const jobId = await enqueueArtifactsJob(
    {
      leadId: lead.id,
      userId: lead.userId,
    },
    `artifacts-${lead.id}-${Date.now()}`,
  );

  return { ok: true, jobId };
}

import type { LeadStatus } from "@leadforge/db";
import { prisma } from "@leadforge/db";

import { validateStatusTransition } from "@/lib/crm/status-transitions";

export async function updateLeadStatusForUser(input: {
  userId: string;
  leadId: string;
  status: LeadStatus;
}): Promise<
  | { ok: true; lead: { id: string; status: LeadStatus } }
  | { ok: false; status: number; message: string }
> {
  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, userId: input.userId },
    select: { id: true, status: true },
  });

  if (!lead) {
    return { ok: false, status: 404, message: "Lead not found" };
  }

  const transitionError = validateStatusTransition(lead.status, input.status);
  if (transitionError) {
    return { ok: false, status: 400, message: transitionError };
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { status: input.status },
    select: { id: true, status: true },
  });

  return { ok: true, lead: updated };
}

import { prisma, type Lead } from "@leadforge/db";

export async function getLeadForUser(
  userId: string,
  leadId: string,
): Promise<Lead | null> {
  return prisma.lead.findFirst({
    where: { id: leadId, userId },
  });
}

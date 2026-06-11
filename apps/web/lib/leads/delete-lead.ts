import { prisma } from "@leadforge/db";

export async function deleteLeadForUser(
  userId: string,
  leadId: string,
): Promise<boolean> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    select: { id: true },
  });

  if (!lead) {
    return false;
  }

  await prisma.lead.delete({
    where: { id: lead.id },
  });

  return true;
}

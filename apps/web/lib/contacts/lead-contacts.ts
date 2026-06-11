import { prisma } from "@leadforge/db";

export async function listLeadContacts(userId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    select: { id: true },
  });

  if (!lead) {
    return null;
  }

  return prisma.contact.findMany({
    where: { leadId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      notes: true,
      status: true,
      nextContact: true,
    },
  });
}

export async function createLeadContact(input: {
  userId: string;
  leadId: string;
  notes: string;
  status: string;
  nextContact?: Date;
}) {
  if (!input.notes.trim()) {
    return { ok: false as const, status: 400, message: "notes is required" };
  }

  if (!input.status.trim()) {
    return { ok: false as const, status: 400, message: "status is required" };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, userId: input.userId },
    select: { id: true },
  });

  if (!lead) {
    return { ok: false as const, status: 404, message: "Lead not found" };
  }

  const contact = await prisma.contact.create({
    data: {
      leadId: lead.id,
      notes: input.notes.trim(),
      status: input.status,
      date: new Date(),
      nextContact: input.nextContact,
    },
    select: {
      id: true,
      date: true,
      notes: true,
      status: true,
      nextContact: true,
    },
  });

  return { ok: true as const, contact };
}

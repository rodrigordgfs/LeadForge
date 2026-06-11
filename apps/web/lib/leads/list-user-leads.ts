import type { LeadStatus } from "@leadforge/db";
import { prisma } from "@leadforge/db";

export async function listUserLeads(userId: string) {
  return prisma.lead.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { score: { sort: "asc", nulls: "last" } }],
    select: {
      id: true,
      name: true,
      city: true,
      score: true,
      scoreBand: true,
      status: true,
    },
  });
}

export function groupLeadsByStatus(
  leads: Awaited<ReturnType<typeof listUserLeads>>,
): Record<LeadStatus, typeof leads> {
  const grouped = {
    novo: [],
    em_contato: [],
    interessado: [],
    proposta_enviada: [],
    negociacao: [],
    fechado: [],
    perdido: [],
  } as Record<LeadStatus, typeof leads>;

  for (const lead of leads) {
    grouped[lead.status].push(lead);
  }

  return grouped;
}

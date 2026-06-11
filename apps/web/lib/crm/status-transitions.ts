import { LeadStatus } from "@leadforge/db";

const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.novo]: [LeadStatus.em_contato, LeadStatus.perdido],
  [LeadStatus.em_contato]: [LeadStatus.interessado, LeadStatus.perdido],
  [LeadStatus.interessado]: [LeadStatus.proposta_enviada, LeadStatus.perdido],
  [LeadStatus.proposta_enviada]: [LeadStatus.negociacao, LeadStatus.perdido],
  [LeadStatus.negociacao]: [LeadStatus.fechado, LeadStatus.perdido],
  [LeadStatus.fechado]: [],
  [LeadStatus.perdido]: [],
};

const ALL_STATUSES = new Set<string>(Object.values(LeadStatus));

export function isValidLeadStatus(status: string): status is LeadStatus {
  return ALL_STATUSES.has(status);
}

export function isValidStatusTransition(
  from: LeadStatus,
  to: LeadStatus,
): boolean {
  if (from === to) {
    return true;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function validateStatusTransition(
  from: LeadStatus,
  to: LeadStatus,
): string | null {
  if (isValidStatusTransition(from, to)) {
    return null;
  }

  return `Transição inválida de ${from} para ${to}`;
}

export function getAllowedTransitions(status: LeadStatus): LeadStatus[] {
  return [...ALLOWED_TRANSITIONS[status]];
}

import { describe, expect, it } from "vitest";

import { LeadStatus } from "@leadforge/db";

import {
  getAllowedTransitions,
  isValidLeadStatus,
  isValidStatusTransition,
} from "@/lib/crm/status-transitions";

describe("status-transitions", () => {
  it("accepts all 7 LeadStatus values", () => {
    for (const status of Object.values(LeadStatus)) {
      expect(isValidLeadStatus(status)).toBe(true);
    }
  });

  it("rejects unknown status strings", () => {
    expect(isValidLeadStatus("invalid")).toBe(false);
  });

  it("allows Novo → Em Contato", () => {
    expect(
      isValidStatusTransition(LeadStatus.novo, LeadStatus.em_contato),
    ).toBe(true);
  });

  it("rejects Novo → Fechado", () => {
    expect(isValidStatusTransition(LeadStatus.novo, LeadStatus.fechado)).toBe(
      false,
    );
  });

  it("allows Negociacao → Fechado", () => {
    expect(
      isValidStatusTransition(LeadStatus.negociacao, LeadStatus.fechado),
    ).toBe(true);
  });

  it("returns empty transitions for terminal statuses", () => {
    expect(getAllowedTransitions(LeadStatus.fechado)).toEqual([]);
    expect(getAllowedTransitions(LeadStatus.perdido)).toEqual([]);
  });

  it("allows same-status no-op transitions", () => {
    expect(isValidStatusTransition(LeadStatus.novo, LeadStatus.novo)).toBe(
      true,
    );
  });
});

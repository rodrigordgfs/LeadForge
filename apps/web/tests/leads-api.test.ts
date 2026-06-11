import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const leadFindFirstMock = vi.fn();
const leadUpdateMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirstMock(...args),
      update: (...args: unknown[]) => leadUpdateMock(...args),
    },
  },
  LeadStatus: {
    novo: "novo",
    em_contato: "em_contato",
    interessado: "interessado",
    proposta_enviada: "proposta_enviada",
    negociacao: "negociacao",
    fechado: "fechado",
    perdido: "perdido",
  },
}));

import { GET as getLeadRoute, PATCH as patchLeadRoute } from "@/app/api/leads/[id]/route";
import { getLeadDetailForUser } from "@/lib/leads/get-lead-detail";
import { updateLeadStatusForUser } from "@/lib/leads/update-lead-status";

const baseLead = {
  id: "lead_1",
  userId: "user_1",
  searchJobId: "job_1",
  name: "Barbearia Test",
  category: "Barbearia",
  address: "Rua 1",
  city: "Pelotas",
  state: "RS",
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  instagram: null,
  rating: 4.5,
  reviewCount: 10,
  mapsUrl: "https://maps.google.com",
  score: 35,
  scoreBand: "low",
  hasRealWebsite: false,
  diagnosisJson: {
    problems: ["No website"],
    opportunities: ["Create landing page"],
    psi_available: true,
  },
  status: "novo",
  autoPipelineTriggered: false,
  artifacts: [
    { type: "proposal_pdf", filename: "proposal.pdf", sizeBytes: 1024 },
  ],
};

describe("getLeadDetailForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for another user's lead", async () => {
    leadFindFirstMock.mockResolvedValue(null);

    const result = await getLeadDetailForUser("user_2", "lead_1");

    expect(result).toBeNull();
  });

  it("includes diagnosis summary and artifact metadata without base64", async () => {
    leadFindFirstMock.mockResolvedValue(baseLead);

    const result = await getLeadDetailForUser("user_1", "lead_1");

    expect(result).not.toBeNull();
    expect(result?.score).toBe(35);
    expect(result?.scoreBand).toBe("low");
    expect(result?.diagnosis?.problems).toEqual(["No website"]);
    expect(result?.artifacts).toEqual([
      { type: "proposal_pdf", filename: "proposal.pdf", sizeBytes: 1024 },
    ]);
    expect(result).not.toHaveProperty("contentBase64");
  });
});

describe("updateLeadStatusForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates Novo → Em Contato", async () => {
    leadFindFirstMock.mockResolvedValue({ id: "lead_1", status: "novo" });
    leadUpdateMock.mockResolvedValue({
      id: "lead_1",
      status: "em_contato",
    });

    const result = await updateLeadStatusForUser({
      userId: "user_1",
      leadId: "lead_1",
      status: "em_contato",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lead.status).toBe("em_contato");
    }
  });

  it("returns 400 for Novo → Fechado", async () => {
    leadFindFirstMock.mockResolvedValue({ id: "lead_1", status: "novo" });

    const result = await updateLeadStatusForUser({
      userId: "user_1",
      leadId: "lead_1",
      status: "fechado",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("returns 404 when lead belongs to another user", async () => {
    leadFindFirstMock.mockResolvedValue(null);

    const result = await updateLeadStatusForUser({
      userId: "user_2",
      leadId: "lead_1",
      status: "em_contato",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });
});

describe("GET /api/leads/:id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for another user's lead", async () => {
    authMock.mockResolvedValue({ userId: "user_2" });
    leadFindFirstMock.mockResolvedValue(null);

    const response = await getLeadRoute(
      new Request("http://localhost/api/leads/lead_1"),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/leads/:id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await patchLeadRoute(
      new Request("http://localhost/api/leads/lead_1", {
        method: "PATCH",
        body: JSON.stringify({ status: "em_contato" }),
      }),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(401);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Lead CRM integration", () => {
  it("runs full CRM flow Novo → Em Contato → Interessado → Proposta Enviada", async () => {
    const { prisma, LeadStatus } = await import("@leadforge/db");

    const userId = `crm-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "CRM User",
        email: `crm-${Date.now()}@example.com`,
      },
    });

    const searchJob = await prisma.searchJob.create({
      data: {
        userId,
        segmentId: "saude",
        state: "RS",
        city: "Pelotas",
      },
    });

    const lead = await prisma.lead.create({
      data: {
        userId,
        searchJobId: searchJob.id,
        name: "CRM Lead",
        category: "Clinica",
        address: "Rua CRM",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com",
        status: LeadStatus.novo,
      },
    });

    const steps = [
      LeadStatus.em_contato,
      LeadStatus.interessado,
      LeadStatus.proposta_enviada,
    ] as const;

    for (const status of steps) {
      const result = await updateLeadStatusForUser({
        userId,
        leadId: lead.id,
        status,
      });
      expect(result.ok).toBe(true);
    }

    const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updated?.status).toBe(LeadStatus.proposta_enviada);

    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: userId } });
  });
});

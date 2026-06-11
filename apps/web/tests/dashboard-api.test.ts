import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const userFindUniqueMock = vi.fn();
const leadFindManyMock = vi.fn();
const searchJobFindManyMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUniqueMock(...args),
    },
    lead: {
      findMany: (...args: unknown[]) => leadFindManyMock(...args),
    },
    searchJob: {
      findMany: (...args: unknown[]) => searchJobFindManyMock(...args),
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

import { GET as getDashboardRoute } from "@/app/api/dashboard/route";
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats";

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns counts grouped by status", async () => {
    userFindUniqueMock.mockResolvedValue({
      settingsJson: { highOpportunityThreshold: 60 },
    });
    leadFindManyMock.mockResolvedValue([
      { status: "novo", score: 30, hasRealWebsite: false },
      { status: "novo", score: 80, hasRealWebsite: true },
      { status: "em_contato", score: 55, hasRealWebsite: false },
      { status: "fechado", score: 20, hasRealWebsite: false },
    ]);
    searchJobFindManyMock.mockResolvedValue([]);

    const stats = await getDashboardStats("user_1");

    expect(stats.totalLeads).toBe(4);
    expect(stats.byStatus.novo).toBe(2);
    expect(stats.byStatus.em_contato).toBe(1);
    expect(stats.byStatus.fechado).toBe(1);
    expect(stats.byStatus.interessado).toBe(0);
    expect(stats.highOpportunityCount).toBe(3);
  });
});

describe("GET /api/dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await getDashboardRoute();

    expect(response.status).toBe(401);
  });

  it("returns dashboard stats for authenticated user", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    userFindUniqueMock.mockResolvedValue({
      settingsJson: { highOpportunityThreshold: 60 },
    });
    leadFindManyMock.mockResolvedValue([
      { status: "novo", score: 30, hasRealWebsite: false },
    ]);
    searchJobFindManyMock.mockResolvedValue([]);

    const response = await getDashboardRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalLeads).toBe(1);
    expect(body.byStatus.novo).toBe(1);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Dashboard integration", () => {
  it("updates counts after status change", async () => {
    const { prisma, LeadStatus } = await import("@leadforge/db");
    const { updateLeadStatusForUser } = await import(
      "@/lib/leads/update-lead-status"
    );

    const userId = `dash-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Dashboard User",
        email: `dash-${Date.now()}@example.com`,
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
        name: "Dash Lead",
        category: "Clinica",
        address: "Rua Dash",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com",
        status: LeadStatus.novo,
        score: 40,
        hasRealWebsite: false,
      },
    });

    const before = await getDashboardStats(userId);
    expect(before.byStatus.novo).toBe(1);

    await updateLeadStatusForUser({
      userId,
      leadId: lead.id,
      status: LeadStatus.em_contato,
    });

    const after = await getDashboardStats(userId);
    expect(after.byStatus.novo).toBe(0);
    expect(after.byStatus.em_contato).toBe(1);

    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: userId } });
  });
});

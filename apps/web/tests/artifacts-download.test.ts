import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const leadFindFirstMock = vi.fn();
const artifactFindFirstMock = vi.fn();
const leadDeleteMock = vi.fn();
const enqueueAnalyzeJobMock = vi.fn();
const enqueueArtifactsJobMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirstMock(...args),
      delete: (...args: unknown[]) => leadDeleteMock(...args),
    },
    artifact: {
      findFirst: (...args: unknown[]) => artifactFindFirstMock(...args),
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
  ArtifactType: {
    company_txt: "company_txt",
    analysis_txt: "analysis_txt",
    website_brief_txt: "website_brief_txt",
    proposal_pdf: "proposal_pdf",
    diagnosis_pdf: "diagnosis_pdf",
    wireframe_pdf: "wireframe_pdf",
  },
}));

vi.mock("@leadforge/queue", () => ({
  enqueueAnalyzeJob: (...args: unknown[]) => enqueueAnalyzeJobMock(...args),
  enqueueArtifactsJob: (...args: unknown[]) => enqueueArtifactsJobMock(...args),
}));

import { DELETE as deleteLeadRoute } from "@/app/api/leads/[id]/route";
import { POST as postAnalyzeRoute } from "@/app/api/leads/[id]/analyze/route";
import { POST as postArtifactsRoute } from "@/app/api/leads/[id]/artifacts/route";
import { GET as getArtifactRoute } from "@/app/api/leads/[id]/artifacts/[type]/route";
import { getArtifactDownload } from "@/lib/leads/get-artifact-download";
import { triggerLeadArtifacts } from "@/lib/leads/trigger-artifacts";
import { triggerLeadAnalyze } from "@/lib/leads/trigger-analyze";
import { deleteLeadForUser } from "@/lib/leads/delete-lead";

const baseLead = {
  id: "lead_1",
  userId: "user_1",
  searchJobId: "job_1",
  diagnosedAt: new Date(Date.now() - 60 * 60 * 1000),
};

describe("getArtifactDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns decoded bytes for stored base64 content", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 test");
    artifactFindFirstMock.mockResolvedValue({
      filename: "proposal.pdf",
      mimeType: "application/pdf",
      contentBase64: pdfBytes.toString("base64"),
    });

    const result = await getArtifactDownload(
      "user_1",
      "lead_1",
      "proposal_pdf",
    );

    expect(result?.mimeType).toBe("application/pdf");
    expect(result?.bytes.equals(pdfBytes)).toBe(true);
  });

  it("returns null for missing artifact type", async () => {
    artifactFindFirstMock.mockResolvedValue(null);

    const result = await getArtifactDownload(
      "user_1",
      "lead_1",
      "proposal_pdf",
    );

    expect(result).toBeNull();
  });
});

describe("GET /api/leads/:id/artifacts/:type route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns application/pdf for proposal_pdf", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    const pdfBytes = Buffer.from("%PDF-1.4");
    artifactFindFirstMock.mockResolvedValue({
      filename: "proposal.pdf",
      mimeType: "application/pdf",
      contentBase64: pdfBytes.toString("base64"),
    });

    const response = await getArtifactRoute(
      new Request("http://localhost/api/leads/lead_1/artifacts/proposal_pdf"),
      { params: Promise.resolve({ id: "lead_1", type: "proposal_pdf" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("proposal.pdf");
  });

  it("returns 404 for missing artifact", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    artifactFindFirstMock.mockResolvedValue(null);

    const response = await getArtifactRoute(
      new Request("http://localhost/api/leads/lead_1/artifacts/proposal_pdf"),
      { params: Promise.resolve({ id: "lead_1", type: "proposal_pdf" }) },
    );

    expect(response.status).toBe(404);
  });
});

describe("triggerLeadArtifacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues artifacts job regardless of score", async () => {
    leadFindFirstMock.mockResolvedValue({ ...baseLead, score: 95 });
    enqueueArtifactsJobMock.mockResolvedValue("artifacts-job-1");

    const result = await triggerLeadArtifacts("user_1", "lead_1");

    expect(result.ok).toBe(true);
    expect(enqueueArtifactsJobMock).toHaveBeenCalledWith(
      { leadId: "lead_1", userId: "user_1" },
      expect.any(String),
    );
  });
});

describe("triggerLeadAnalyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 429 when diagnosed within 24h without force", async () => {
    leadFindFirstMock.mockResolvedValue({
      ...baseLead,
      diagnosedAt: new Date(),
    });

    const result = await triggerLeadAnalyze("user_1", "lead_1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
    }
  });

  it("enqueues analyze job when force is true", async () => {
    leadFindFirstMock.mockResolvedValue({
      ...baseLead,
      diagnosedAt: new Date(),
    });
    enqueueAnalyzeJobMock.mockResolvedValue("analyze-job-1");

    const result = await triggerLeadAnalyze("user_1", "lead_1", { force: true });

    expect(result.ok).toBe(true);
    expect(enqueueAnalyzeJobMock).toHaveBeenCalledOnce();
  });
});

describe("deleteLeadForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes owned lead", async () => {
    leadFindFirstMock.mockResolvedValue({ id: "lead_1" });
    leadDeleteMock.mockResolvedValue({ id: "lead_1" });

    const deleted = await deleteLeadForUser("user_1", "lead_1");

    expect(deleted).toBe(true);
    expect(leadDeleteMock).toHaveBeenCalledOnce();
  });
});

describe("POST /api/leads/:id/artifacts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 202 with jobId", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    leadFindFirstMock.mockResolvedValue(baseLead);
    enqueueArtifactsJobMock.mockResolvedValue("artifacts-job-1");

    const response = await postArtifactsRoute(
      new Request("http://localhost/api/leads/lead_1/artifacts", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.jobId).toBe("artifacts-job-1");
  });
});

describe("POST /api/leads/:id/analyze route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 202 when analyze is enqueued", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    leadFindFirstMock.mockResolvedValue({
      ...baseLead,
      diagnosedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    enqueueAnalyzeJobMock.mockResolvedValue("analyze-job-1");

    const response = await postAnalyzeRoute(
      new Request("http://localhost/api/leads/lead_1/analyze", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(202);
  });
});

describe("DELETE /api/leads/:id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 204 when lead is deleted", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    leadFindFirstMock.mockResolvedValue({ id: "lead_1" });
    leadDeleteMock.mockResolvedValue({ id: "lead_1" });

    const response = await deleteLeadRoute(
      new Request("http://localhost/api/leads/lead_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(204);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasRedis = Boolean(process.env.REDIS_URL);

describe.skipIf(!hasDatabase)("Artifact download integration", () => {
  it("returns bytes matching stored base64 content", async () => {
    const { prisma, LeadStatus, ArtifactType } = await import("@leadforge/db");

    const userId = `artifact-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Artifact User",
        email: `artifact-${Date.now()}@example.com`,
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
        name: "Artifact Lead",
        category: "Clinica",
        address: "Rua Artifact",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com",
        status: LeadStatus.novo,
      },
    });

    const content = Buffer.from("hello artifact");
    await prisma.artifact.create({
      data: {
        leadId: lead.id,
        type: ArtifactType.proposal_pdf,
        filename: "proposal.pdf",
        mimeType: "application/pdf",
        contentBase64: content.toString("base64"),
        sizeBytes: content.length,
      },
    });

    const download = await getArtifactDownload(
      userId,
      lead.id,
      ArtifactType.proposal_pdf,
    );

    expect(download?.bytes.equals(content)).toBe(true);

    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: userId } });
  });
});

describe.skipIf(!hasDatabase || !hasRedis)("Manual analyze integration", () => {
  it("enqueues analyze job for lead", async () => {
    const { prisma, LeadStatus } = await import("@leadforge/db");
    const { getAnalyzeQueue, closeAnalyzeQueue, resetRedisConnection } =
      await import("@leadforge/queue");

    const userId = `analyze-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Analyze User",
        email: `analyze-${Date.now()}@example.com`,
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
        name: "Analyze Lead",
        category: "Clinica",
        address: "Rua Analyze",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com",
        status: LeadStatus.novo,
        diagnosedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    });

    const result = await triggerLeadAnalyze(userId, lead.id);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const job = await getAnalyzeQueue().getJob(result.jobId);
      expect(job?.data.leadId).toBe(lead.id);
      await job?.remove();
    }

    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: userId } });
    await closeAnalyzeQueue();
    resetRedisConnection();
  });
});

describe.skipIf(!hasDatabase)("Lead deletion integration", () => {
  it("DELETE removes lead and cascaded artifacts", async () => {
    const { prisma, LeadStatus, ArtifactType } = await import("@leadforge/db");

    const userId = `delete-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Delete User",
        email: `delete-${Date.now()}@example.com`,
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
        name: "Delete Lead",
        category: "Clinica",
        address: "Rua Delete",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com",
        status: LeadStatus.novo,
      },
    });

    await prisma.artifact.create({
      data: {
        leadId: lead.id,
        type: ArtifactType.company_txt,
        filename: "company.txt",
        mimeType: "text/plain",
        contentBase64: Buffer.from("company").toString("base64"),
        sizeBytes: 7,
      },
    });

    const deleted = await deleteLeadForUser(userId, lead.id);
    expect(deleted).toBe(true);

    const artifactCount = await prisma.artifact.count({
      where: { leadId: lead.id },
    });
    expect(artifactCount).toBe(0);

    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: userId } });
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_PATH = join(import.meta.dirname, "../prisma/schema.prisma");
const schema = readFileSync(SCHEMA_PATH, "utf8");

describe("schema.prisma metadata", () => {
  it("defines LeadStatus enum with all 7 PRD CRM values", () => {
    const leadStatuses = [
      "novo",
      "em_contato",
      "interessado",
      "proposta_enviada",
      "negociacao",
      "fechado",
      "perdido",
    ];

    for (const status of leadStatuses) {
      expect(schema).toContain(status);
    }
  });

  it("defines ArtifactType enum with all 6 artifact types", () => {
    const artifactTypes = [
      "company_txt",
      "analysis_txt",
      "website_brief_txt",
      "proposal_pdf",
      "diagnosis_pdf",
      "wireframe_pdf",
    ];

    for (const type of artifactTypes) {
      expect(schema).toContain(type);
    }
  });

  it("defines SearchJobStatus enum values", () => {
    for (const status of ["pending", "running", "completed", "failed"]) {
      expect(schema).toContain(status);
    }
  });

  it("defines ScoreBand enum values", () => {
    for (const band of ["critical", "low", "medium", "excellent"]) {
      expect(schema).toContain(band);
    }
  });

  it("includes required Lead indexes", () => {
    expect(schema).toContain("@@index([userId, status])");
    expect(schema).toContain("@@index([searchJobId])");
    expect(schema).toContain("@@index([score])");
  });

  it("includes Artifact index on leadId and type", () => {
    expect(schema).toContain("@@index([leadId, type])");
  });

  it("configures Artifact.contentBase64 as Text with cascade delete from Lead", () => {
    expect(schema).toContain("contentBase64 String       @db.Text");
    expect(schema).toMatch(/model Lead[\s\S]*?artifacts Artifact\[\]/);
    expect(schema).toMatch(
      /model Artifact[\s\S]*?lead\s+Lead\s+@relation\(fields: \[leadId\], references: \[id\], onDelete: Cascade\)/,
    );
  });

  it("cascades delete from Lead to Contact, Proposal, and Prompt", () => {
    for (const model of ["Contact", "Proposal", "Prompt"]) {
      expect(schema).toMatch(
        new RegExp(
          `model ${model}[\\s\\S]*?onDelete: Cascade`,
        ),
      );
    }
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Prisma integration", () => {
  it("creates User → SearchJob → Lead → Artifact and cascades on lead delete", async () => {
    const { prisma, LeadStatus, SearchJobStatus, ArtifactType } = await import(
      "../src/index.js"
    );

    const user = await prisma.user.create({
      data: {
        id: `test-user-${Date.now()}`,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
      },
    });

    const searchJob = await prisma.searchJob.create({
      data: {
        userId: user.id,
        segmentId: "saude",
        state: "RS",
        city: "Pelotas",
        status: SearchJobStatus.pending,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        searchJobId: searchJob.id,
        name: "Clínica Teste",
        category: "Dentista",
        address: "Rua Teste 123",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com/example",
        status: LeadStatus.novo,
      },
    });

    await prisma.contact.create({
      data: {
        leadId: lead.id,
        date: new Date(),
        notes: "Primeiro contato",
        status: "novo",
      },
    });

    await prisma.proposal.create({
      data: {
        leadId: lead.id,
        value: 1500,
        scope: "Site institucional",
        deadline: "30 dias",
        status: "draft",
      },
    });

    await prisma.prompt.create({
      data: {
        leadId: lead.id,
        title: "Diagnóstico",
        content: "Prompt content",
      },
    });

    await prisma.artifact.create({
      data: {
        leadId: lead.id,
        type: ArtifactType.company_txt,
        filename: "company.txt",
        mimeType: "text/plain",
        contentBase64: Buffer.from("empresa").toString("base64"),
        sizeBytes: 7,
      },
    });

    await prisma.lead.delete({ where: { id: lead.id } });

    const remainingContacts = await prisma.contact.count({
      where: { leadId: lead.id },
    });
    const remainingProposals = await prisma.proposal.count({
      where: { leadId: lead.id },
    });
    const remainingArtifacts = await prisma.artifact.count({
      where: { leadId: lead.id },
    });
    const remainingPrompts = await prisma.prompt.count({
      where: { leadId: lead.id },
    });

    expect(remainingContacts).toBe(0);
    expect(remainingProposals).toBe(0);
    expect(remainingArtifacts).toBe(0);
    expect(remainingPrompts).toBe(0);

    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });
});

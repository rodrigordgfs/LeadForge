import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  artifactFindFirstMock,
  artifactCreateMock,
  artifactUpdateMock,
  proposalFindFirstMock,
  proposalCreateMock,
  proposalUpdateMock,
} = vi.hoisted(() => ({
  artifactFindFirstMock: vi.fn(),
  artifactCreateMock: vi.fn(),
  artifactUpdateMock: vi.fn(),
  proposalFindFirstMock: vi.fn(),
  proposalCreateMock: vi.fn(),
  proposalUpdateMock: vi.fn(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    artifact: {
      findFirst: artifactFindFirstMock,
      create: artifactCreateMock,
      update: artifactUpdateMock,
    },
    proposal: {
      findFirst: proposalFindFirstMock,
      create: proposalCreateMock,
      update: proposalUpdateMock,
    },
  },
}));

vi.mock("../src/artifacts/pdf-renderer.js", () => ({
  renderProposalPdf: vi.fn().mockResolvedValue(Buffer.from("%PDF-proposal")),
  renderDiagnosisPdf: vi.fn().mockResolvedValue(Buffer.from("%PDF-diagnosis")),
  renderWireframePdf: vi.fn().mockResolvedValue(Buffer.from("%PDF-wireframe")),
}));

import {
  ARTIFACT_FILE_META,
  ARTIFACT_TYPE,
  ArtifactTooLargeError,
  decodeBase64,
  encodeBase64,
  MAX_ARTIFACT_SIZE_BYTES,
  storeAllArtifacts,
  upsertArtifact,
  upsertProposal,
} from "../src/artifacts/artifact-storage.js";
import type { GeneratedTextArtifacts } from "../src/artifacts/text-generator.js";

const generatedArtifacts: GeneratedTextArtifacts = {
  companyTxt: {
    nome: "Auto Center Silva",
    categoria: "Auto Center",
    cidade: "Pelotas",
    telefone: "(53) 99999-0000",
    whatsapp: "(53) 99999-0000",
    email: "contato@autocenter.com",
    website: "Não possui",
    redesSociais: "Instagram",
    servicos: "Mecânica geral",
  },
  analysisTxt: {
    score: 35,
    problemas: ["Não possui website"],
    oportunidades: ["Site institucional"],
    recomendacoes: ["Criar site responsivo"],
  },
  websiteBriefTxt: {
    objetivo: "Gerar leads locais",
    publicoAlvo: "Motoristas",
    estrutura: "Site institucional",
    paginas: ["Home"],
    secoes: ["Hero"],
    estiloVisual: "Moderno",
    cta: "WhatsApp",
  },
  wireframe: {
    pages: [
      {
        name: "Home",
        sections: [
          {
            name: "Hero",
            suggestedComponents: ["Título", "CTA"],
          },
        ],
      },
    ],
  },
  diagnosis: {
    narrative: "Baixa maturidade digital.",
  },
  proposal: {
    scope: "Site institucional",
    value: 4500,
    deadline: "30 dias",
    monthlyFee: 350,
    observations: "Manutenção inclusa",
  },
};

function mockArtifactCreate(
  type: (typeof ARTIFACT_TYPE)[keyof typeof ARTIFACT_TYPE],
  id: string,
) {
  artifactCreateMock.mockImplementationOnce(
    async (args: { data: { type: string } }) => ({
      id,
      leadId: "lead-1",
      type: args.data.type,
      filename: ARTIFACT_FILE_META[type].filename,
      mimeType: ARTIFACT_FILE_META[type].mimeType,
      contentBase64: "dGVzdA==",
      sizeBytes: 4,
      createdAt: new Date(),
    }),
  );
}

describe("artifact storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    artifactFindFirstMock.mockResolvedValue(null);
    proposalFindFirstMock.mockResolvedValue(null);
    proposalCreateMock.mockResolvedValue({ id: "proposal-1" });
  });

  it("rejects content exceeding 5 MB with ArtifactTooLargeError", async () => {
    const oversized = Buffer.alloc(MAX_ARTIFACT_SIZE_BYTES + 1);

    await expect(
      upsertArtifact("lead-1", ARTIFACT_TYPE.companyTxt, oversized),
    ).rejects.toThrow(ArtifactTooLargeError);

    expect(artifactCreateMock).not.toHaveBeenCalled();
  });

  it("preserves exact file bytes in base64 round-trip", () => {
    const original = Buffer.from("conteúdo do artefato", "utf8");
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);

    expect(decoded.equals(original)).toBe(true);
  });

  it("stores company_txt with text/plain mimeType and .txt filename", async () => {
    mockArtifactCreate(ARTIFACT_TYPE.companyTxt, "artifact-1");

    await upsertArtifact(
      "lead-1",
      ARTIFACT_TYPE.companyTxt,
      Buffer.from("empresa", "utf8"),
    );

    expect(artifactCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ARTIFACT_TYPE.companyTxt,
        filename: "company.txt",
        mimeType: "text/plain",
        sizeBytes: 7,
      }),
    });
  });

  it("upserts existing artifact type for the same lead", async () => {
    artifactFindFirstMock.mockResolvedValue({
      id: "artifact-existing",
      leadId: "lead-1",
      type: ARTIFACT_TYPE.analysisTxt,
    });
    artifactUpdateMock.mockResolvedValue({ id: "artifact-existing" });

    await upsertArtifact(
      "lead-1",
      ARTIFACT_TYPE.analysisTxt,
      Buffer.from("análise", "utf8"),
    );

    expect(artifactUpdateMock).toHaveBeenCalledWith({
      where: { id: "artifact-existing" },
      data: expect.objectContaining({
        filename: "analysis.txt",
        mimeType: "text/plain",
      }),
    });
    expect(artifactCreateMock).not.toHaveBeenCalled();
  });

  it("creates proposal record with value and scope from generated content", async () => {
    await upsertProposal("lead-1", generatedArtifacts.proposal);

    expect(proposalCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-1",
        value: 4500,
        scope: "Site institucional",
        deadline: "30 dias",
        status: "draft",
      }),
    });
  });

  it("stores all 6 artifact types for one lead", async () => {
    const types = [
      ARTIFACT_TYPE.companyTxt,
      ARTIFACT_TYPE.analysisTxt,
      ARTIFACT_TYPE.websiteBriefTxt,
      ARTIFACT_TYPE.wireframePdf,
      ARTIFACT_TYPE.diagnosisPdf,
      ARTIFACT_TYPE.proposalPdf,
    ];

    for (const [index, type] of types.entries()) {
      mockArtifactCreate(type, `artifact-${index + 1}`);
    }

    const stored = await storeAllArtifacts(
      "lead-1",
      "Auto Center Silva",
      generatedArtifacts,
    );

    expect(stored).toHaveLength(6);
    expect(artifactCreateMock).toHaveBeenCalledTimes(6);
    expect(proposalCreateMock).toHaveBeenCalledTimes(1);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("artifact storage integration", () => {
  it("stores and retrieves all 6 artifact types in test database", async () => {
    vi.resetModules();
    vi.doUnmock("@leadforge/db");
    vi.doUnmock("../src/artifacts/pdf-renderer.js");

    const { storeAllArtifacts: storeAllArtifactsReal } = await import(
      "../src/artifacts/artifact-storage.js"
    );
    const { prisma, LeadStatus, SearchJobStatus } = await import("@leadforge/db");

    const user = await prisma.user.create({
      data: {
        id: `artifact-user-${Date.now()}`,
        name: "Artifact Test User",
        email: `artifact-${Date.now()}@example.com`,
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
        name: "Clínica Artefatos",
        category: "Dentista",
        address: "Rua Teste 123",
        city: "Pelotas",
        state: "RS",
        mapsUrl: "https://maps.google.com/example",
        status: LeadStatus.novo,
      },
    });

    const stored = await storeAllArtifactsReal(
      lead.id,
      lead.name,
      generatedArtifacts,
    );

    expect(stored).toHaveLength(6);

    const artifacts = await prisma.artifact.findMany({
      where: { leadId: lead.id },
    });
    expect(artifacts).toHaveLength(6);

    const proposal = await prisma.proposal.findFirst({
      where: { leadId: lead.id },
    });
    expect(proposal?.scope).toBe("Site institucional");
    expect(Number(proposal?.value)).toBe(4500);

    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});

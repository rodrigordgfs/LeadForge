import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lead } from "@leadforge/db";

const promptCreateMock = vi.fn();

vi.mock("@leadforge/db", () => ({
  prisma: {
    prompt: {
      create: (...args: unknown[]) => promptCreateMock(...args),
    },
  },
}));

import { createMockOpenAiClient } from "../src/artifacts/openai-mock.js";
import {
  TextArtifactGenerator,
  formatCompanyTxt,
  formatAnalysisTxt,
} from "../src/artifacts/text-generator.js";
import {
  ParseError,
  parseStructuredResponse,
  companyTxtResponseSchema,
} from "../src/artifacts/types.js";
import { buildCompanyTxtPrompt } from "../src/artifacts/prompts/txt-files.js";

const lead: Lead = {
  id: "lead-1",
  userId: "user-1",
  searchJobId: "job-1",
  name: "Auto Center Silva",
  category: "Auto Center",
  address: "Rua 1",
  city: "Pelotas",
  state: "RS",
  phone: "(53) 99999-0000",
  whatsapp: "(53) 99999-0000",
  email: null,
  website: null,
  instagram: "@auto",
  facebook: null,
  rating: 4.8,
  reviewCount: 20,
  mapsUrl: "https://maps.google.com/?cid=1",
  score: 35,
  scoreBand: "critical",
  hasRealWebsite: false,
  diagnosisJson: {
    problems: ["Não possui website", "SEO inexistente", "Sem SSL"],
    opportunities: ["Site institucional", "SEO Local"],
  },
  status: "novo",
  autoPipelineTriggered: false,
  diagnosedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("text generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    promptCreateMock.mockResolvedValue({ id: "prompt-1" });
  });

  it("parses valid OpenAI JSON response into company.txt format", async () => {
    const generator = new TextArtifactGenerator({
      client: createMockOpenAiClient(),
      persistPrompt: vi.fn(),
    });

    const companyTxt = await generator.generateCompanyTxt(lead);
    const formatted = formatCompanyTxt(companyTxt);

    expect(formatted).toContain("Nome: Auto Center Silva");
    expect(formatted).toContain("Categoria: Auto Center");
    expect(formatted).toContain("Cidade: Pelotas");
  });

  it("throws typed ParseError for invalid OpenAI JSON response", () => {
    expect(() =>
      parseStructuredResponse("not-json", companyTxtResponseSchema),
    ).toThrow(ParseError);
  });

  it("includes lead name, city, and top 3 problems in prompt builder", () => {
    const prompt = buildCompanyTxtPrompt({
      name: lead.name,
      category: lead.category,
      city: lead.city,
      state: lead.state,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      website: lead.website,
      instagram: lead.instagram,
      facebook: lead.facebook,
      score: 35,
      problems: ["Não possui website", "SEO inexistente", "Sem SSL"],
      opportunities: ["Site institucional"],
    });

    expect(prompt).toContain("Auto Center Silva");
    expect(prompt).toContain("Pelotas");
    expect(prompt).toContain("Não possui website");
    expect(prompt).toContain("SEO inexistente");
    expect(prompt).toContain("Sem SSL");
  });

  it("generated analysis.txt includes score and opportunities sections", async () => {
    const generator = new TextArtifactGenerator({
      client: createMockOpenAiClient(),
      persistPrompt: vi.fn(),
    });

    const analysisTxt = await generator.generateAnalysisTxt(lead);
    const formatted = formatAnalysisTxt(analysisTxt);

    expect(formatted).toContain("Score:");
    expect(formatted).toContain("Oportunidades:");
    expect(formatted).toContain("SEO Local");
  });

  it("mock OpenAI client produces all text artifact types for fixture lead", async () => {
    const generator = new TextArtifactGenerator({
      client: createMockOpenAiClient(),
      persistPrompt: vi.fn(),
    });

    const artifacts = await generator.generateAll(lead);

    expect(artifacts.companyTxt.nome).toBe("Auto Center Silva");
    expect(artifacts.analysisTxt.score).toBe(35);
    expect(artifacts.websiteBriefTxt.paginas.length).toBeGreaterThan(0);
    expect(artifacts.wireframe.pages.length).toBeGreaterThan(0);
    expect(artifacts.diagnosis.narrative.length).toBeGreaterThan(0);
    expect(artifacts.proposal.value).toBeGreaterThan(0);
  });

  it("persists Prompt record after generation", async () => {
    const persistPrompt = vi.fn().mockResolvedValue(undefined);
    const generator = new TextArtifactGenerator({
      client: createMockOpenAiClient(),
      persistPrompt,
    });

    await generator.generateDiagnosis(lead);

    expect(persistPrompt).toHaveBeenCalledWith(
      "lead-1",
      "diagnosis",
      expect.stringContaining("Auto Center Silva"),
    );
  });
});

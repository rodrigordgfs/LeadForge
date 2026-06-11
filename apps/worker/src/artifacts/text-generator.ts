import { prisma, type Lead } from "@leadforge/db";
import { buildDiagnosisPrompt } from "./prompts/diagnosis.js";
import { buildProposalPrompt } from "./prompts/proposal.js";
import {
  buildAnalysisTxtPrompt,
  buildCompanyTxtPrompt,
  buildWebsiteBriefPrompt,
} from "./prompts/txt-files.js";
import { buildWireframePrompt } from "./prompts/wireframe.js";
import type { OpenAiClient } from "./openai-client.js";
import { createOpenAiClient } from "./openai-client.js";
import {
  analysisTxtResponseSchema,
  companyTxtResponseSchema,
  diagnosisResponseSchema,
  parseStructuredResponse,
  proposalResponseSchema,
  websiteBriefResponseSchema,
  wireframeResponseSchema,
  type AnalysisTxtResponse,
  type CompanyTxtResponse,
  type DiagnosisResponse,
  type LeadPromptContext,
  type ProposalResponse,
  type WebsiteBriefResponse,
  type WireframeResponse,
} from "./types.js";

export interface GeneratedTextArtifacts {
  companyTxt: CompanyTxtResponse;
  analysisTxt: AnalysisTxtResponse;
  websiteBriefTxt: WebsiteBriefResponse;
  wireframe: WireframeResponse;
  diagnosis: DiagnosisResponse;
  proposal: ProposalResponse;
}

export interface TextGeneratorDeps {
  client?: OpenAiClient;
  persistPrompt?: (
    leadId: string,
    title: string,
    content: string,
  ) => Promise<void>;
}

function buildLeadPromptContext(lead: Lead): LeadPromptContext {
  const diagnosis = (lead.diagnosisJson ?? {}) as {
    problems?: string[];
    opportunities?: string[];
  };

  return {
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
    score: lead.score ?? 0,
    problems: diagnosis.problems ?? [],
    opportunities: diagnosis.opportunities ?? [],
  };
}

export function formatCompanyTxt(data: CompanyTxtResponse): string {
  return [
    `Nome: ${data.nome}`,
    `Categoria: ${data.categoria}`,
    `Cidade: ${data.cidade}`,
    `Telefone: ${data.telefone}`,
    `WhatsApp: ${data.whatsapp}`,
    `Email: ${data.email}`,
    `Website: ${data.website}`,
    `Redes Sociais: ${data.redesSociais}`,
    `Serviços: ${data.servicos}`,
  ].join("\n");
}

export function formatAnalysisTxt(data: AnalysisTxtResponse): string {
  return [
    `Score: ${data.score}`,
    "Problemas:",
    ...data.problemas.map((item) => `- ${item}`),
    "Oportunidades:",
    ...data.oportunidades.map((item) => `- ${item}`),
    "Recomendações:",
    ...data.recomendacoes.map((item) => `- ${item}`),
  ].join("\n");
}

export function formatWebsiteBriefTxt(data: WebsiteBriefResponse): string {
  return [
    `Objetivo: ${data.objetivo}`,
    `Público-Alvo: ${data.publicoAlvo}`,
    `Estrutura: ${data.estrutura}`,
    "Páginas:",
    ...data.paginas.map((item) => `- ${item}`),
    "Seções:",
    ...data.secoes.map((item) => `- ${item}`),
    `Estilo Visual: ${data.estiloVisual}`,
    `CTA: ${data.cta}`,
  ].join("\n");
}

async function defaultPersistPrompt(
  leadId: string,
  title: string,
  content: string,
): Promise<void> {
  await prisma.prompt.create({
    data: {
      leadId,
      title,
      content,
    },
  });
}

export class TextArtifactGenerator {
  private readonly client: OpenAiClient;
  private readonly persistPrompt: (
    leadId: string,
    title: string,
    content: string,
  ) => Promise<void>;

  constructor(deps: TextGeneratorDeps = {}) {
    this.client = deps.client ?? createOpenAiClient();
    this.persistPrompt = deps.persistPrompt ?? defaultPersistPrompt;
  }

  private async generateAndParse<T>(
    leadId: string,
    title: string,
    prompt: string,
    schema: Parameters<typeof parseStructuredResponse<T>>[1],
  ): Promise<T> {
    const completion = await this.client.complete({ prompt });
    await this.persistPrompt(leadId, title, completion.prompt);

    return parseStructuredResponse(completion.content, schema);
  }

  async generateCompanyTxt(
    lead: Lead,
    context = buildLeadPromptContext(lead),
  ): Promise<CompanyTxtResponse> {
    return this.generateAndParse(
      lead.id,
      "company.txt",
      buildCompanyTxtPrompt(context),
      companyTxtResponseSchema,
    );
  }

  async generateAnalysisTxt(
    lead: Lead,
    context = buildLeadPromptContext(lead),
  ): Promise<AnalysisTxtResponse> {
    return this.generateAndParse(
      lead.id,
      "analysis.txt",
      buildAnalysisTxtPrompt(context),
      analysisTxtResponseSchema,
    );
  }

  async generateWebsiteBriefTxt(
    lead: Lead,
    context = buildLeadPromptContext(lead),
  ): Promise<WebsiteBriefResponse> {
    return this.generateAndParse(
      lead.id,
      "website-brief.txt",
      buildWebsiteBriefPrompt(context),
      websiteBriefResponseSchema,
    );
  }

  async generateWireframe(
    lead: Lead,
    context = buildLeadPromptContext(lead),
  ): Promise<WireframeResponse> {
    return this.generateAndParse(
      lead.id,
      "wireframe",
      buildWireframePrompt(context),
      wireframeResponseSchema,
    );
  }

  async generateDiagnosis(
    lead: Lead,
    context = buildLeadPromptContext(lead),
  ): Promise<DiagnosisResponse> {
    return this.generateAndParse(
      lead.id,
      "diagnosis",
      buildDiagnosisPrompt(context),
      diagnosisResponseSchema,
    );
  }

  async generateProposal(
    lead: Lead,
    context = buildLeadPromptContext(lead),
  ): Promise<ProposalResponse> {
    return this.generateAndParse(
      lead.id,
      "proposal",
      buildProposalPrompt(context),
      proposalResponseSchema,
    );
  }

  async generateAll(lead: Lead): Promise<GeneratedTextArtifacts> {
    const context = buildLeadPromptContext(lead);

    const [
      companyTxt,
      analysisTxt,
      websiteBriefTxt,
      wireframe,
      diagnosis,
      proposal,
    ] = await Promise.all([
      this.generateCompanyTxt(lead, context),
      this.generateAnalysisTxt(lead, context),
      this.generateWebsiteBriefTxt(lead, context),
      this.generateWireframe(lead, context),
      this.generateDiagnosis(lead, context),
      this.generateProposal(lead, context),
    ]);

    return {
      companyTxt,
      analysisTxt,
      websiteBriefTxt,
      wireframe,
      diagnosis,
      proposal,
    };
  }
}

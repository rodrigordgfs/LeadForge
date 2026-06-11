import { z } from "zod";

export interface LeadPromptContext {
  name: string;
  category: string;
  city: string;
  state: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  score: number;
  problems: string[];
  opportunities: string[];
}

export const diagnosisResponseSchema = z.object({
  narrative: z.string().min(1),
});

export const wireframeSectionSchema = z.object({
  name: z.string().min(1),
  suggestedComponents: z.array(z.string().min(1)).min(1),
});

export const wireframePageSchema = z.object({
  name: z.string().min(1),
  sections: z.array(wireframeSectionSchema).min(1),
});

export const wireframeResponseSchema = z.object({
  pages: z.array(wireframePageSchema).min(1),
});

export const companyTxtResponseSchema = z.object({
  nome: z.string().min(1),
  categoria: z.string().min(1),
  cidade: z.string().min(1),
  telefone: z.string().min(1),
  whatsapp: z.string().min(1),
  email: z.string().min(1),
  website: z.string().min(1),
  redesSociais: z.string().min(1),
  servicos: z.string().min(1),
});

export const analysisTxtResponseSchema = z.object({
  score: z.number(),
  problemas: z.array(z.string()),
  oportunidades: z.array(z.string()),
  recomendacoes: z.array(z.string()),
});

export const websiteBriefResponseSchema = z.object({
  objetivo: z.string().min(1),
  publicoAlvo: z.string().min(1),
  estrutura: z.string().min(1),
  paginas: z.array(z.string().min(1)).min(1),
  secoes: z.array(z.string().min(1)).min(1),
  estiloVisual: z.string().min(1),
  cta: z.string().min(1),
});

export const proposalResponseSchema = z.object({
  scope: z.string().min(1),
  value: z.number().positive(),
  deadline: z.string().min(1),
  monthlyFee: z.number().nonnegative(),
  observations: z.string().min(1),
});

export type DiagnosisResponse = z.infer<typeof diagnosisResponseSchema>;
export type WireframeResponse = z.infer<typeof wireframeResponseSchema>;
export type CompanyTxtResponse = z.infer<typeof companyTxtResponseSchema>;
export type AnalysisTxtResponse = z.infer<typeof analysisTxtResponseSchema>;
export type WebsiteBriefResponse = z.infer<typeof websiteBriefResponseSchema>;
export type ProposalResponse = z.infer<typeof proposalResponseSchema>;

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export function parseStructuredResponse<T>(
  raw: string,
  schema: z.ZodType<T>,
): T {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ParseError("Invalid JSON response from OpenAI");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ParseError(`OpenAI response validation failed: ${result.error.message}`);
  }

  return result.data;
}

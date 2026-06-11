import type { LeadPromptContext } from "../types.js";

export function buildCompanyTxtPrompt(context: LeadPromptContext): string {
  const topProblems = context.problems.slice(0, 3).join("; ") || "Nenhum";

  return [
    "Gere o conteúdo de company.txt em português do Brasil.",
    `Nome: ${context.name}`,
    `Categoria: ${context.category}`,
    `Cidade: ${context.city}`,
    `Estado: ${context.state}`,
    `Telefone: ${context.phone ?? "Não informado"}`,
    `WhatsApp: ${context.whatsapp ?? "Não informado"}`,
    `Email: ${context.email ?? "Não informado"}`,
    `Website: ${context.website ?? "Não possui"}`,
    `Instagram: ${context.instagram ?? "Não informado"}`,
    `Facebook: ${context.facebook ?? "Não informado"}`,
    `Principais problemas: ${topProblems}`,
    "Responda em JSON com campos: nome, categoria, cidade, telefone, whatsapp, email, website, redesSociais, servicos.",
  ].join("\n");
}

export function buildAnalysisTxtPrompt(context: LeadPromptContext): string {
  return [
    "Gere o conteúdo de analysis.txt em português do Brasil.",
    `Empresa: ${context.name}`,
    `Score: ${context.score}`,
    `Problemas: ${context.problems.join("; ") || "Nenhum"}`,
    `Oportunidades: ${context.opportunities.join("; ") || "Nenhuma"}`,
    "Responda em JSON com campos: score, problemas (array), oportunidades (array), recomendacoes (array).",
  ].join("\n");
}

export function buildWebsiteBriefPrompt(context: LeadPromptContext): string {
  return [
    "Gere o conteúdo de website-brief.txt em português do Brasil.",
    `Empresa: ${context.name}`,
    `Categoria: ${context.category}`,
    `Cidade: ${context.city}`,
    `Público-alvo sugerido: clientes locais de ${context.city}`,
    "Responda em JSON com campos: objetivo, publicoAlvo, estrutura, paginas (array), secoes (array), estiloVisual, cta.",
  ].join("\n");
}

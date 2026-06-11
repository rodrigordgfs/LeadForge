import type { LeadPromptContext } from "./types.js";
import type { OpenAiClient, OpenAiCompletionRequest, OpenAiCompletionResult } from "./openai-client.js";

function buildMockResponse(prompt: string): string {
  if (prompt.includes("company.txt")) {
    return JSON.stringify({
      nome: "Auto Center Silva",
      categoria: "Auto Center",
      cidade: "Pelotas",
      telefone: "(53) 99999-0000",
      whatsapp: "(53) 99999-0000",
      email: "contato@autocenter.com",
      website: "Não possui",
      redesSociais: "Instagram",
      servicos: "Mecânica geral, alinhamento e balanceamento",
    });
  }

  if (prompt.includes("analysis.txt")) {
    return JSON.stringify({
      score: 35,
      problemas: ["Não possui website", "SEO inexistente"],
      oportunidades: ["Site institucional", "SEO Local"],
      recomendacoes: ["Criar site responsivo", "Configurar Google Meu Negócio"],
    });
  }

  if (prompt.includes("website-brief.txt")) {
    return JSON.stringify({
      objetivo: "Gerar leads locais",
      publicoAlvo: "Motoristas de Pelotas",
      estrutura: "Site institucional de uma página com blog",
      paginas: ["Home", "Serviços", "Contato"],
      secoes: ["Hero", "Serviços", "Depoimentos", "CTA"],
      estiloVisual: "Moderno e confiável",
      cta: "Agende seu serviço pelo WhatsApp",
    });
  }

  if (prompt.includes("wireframe")) {
    return JSON.stringify({
      pages: [
        {
          name: "Home",
          sections: [
            {
              name: "Hero",
              suggestedComponents: ["Título", "CTA", "Imagem"],
            },
          ],
        },
      ],
    });
  }

  if (prompt.includes("proposta")) {
    return JSON.stringify({
      scope: "Site institucional + SEO local",
      value: 4500,
      deadline: "30 dias",
      monthlyFee: 350,
      observations: "Inclui manutenção mensal básica",
    });
  }

  return JSON.stringify({
    narrative:
      "A empresa apresenta baixa maturidade digital. Recomenda-se site institucional e SEO local.",
  });
}

export function createMockOpenAiClient(
  context?: LeadPromptContext,
): OpenAiClient {
  return {
    async complete(
      request: OpenAiCompletionRequest,
    ): Promise<OpenAiCompletionResult> {
      void context;
      return {
        content: buildMockResponse(request.prompt),
        model: "gpt-4o-mock",
        prompt: request.prompt,
      };
    },
  };
}

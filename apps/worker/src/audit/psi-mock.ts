import type { PsiApiResponse } from "./psi-client.js";
import { createPsiClient, type PsiClient, type PsiMetrics } from "./psi-client.js";

export const MOCK_PSI_RESPONSE: PsiApiResponse = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.72 },
      seo: { score: 0.81 },
    },
    audits: {
      "largest-contentful-paint": { numericValue: 2800 },
      "cumulative-layout-shift": { numericValue: 0.12 },
    },
  },
};

export function createMockPsiFetch(
  response: PsiApiResponse = MOCK_PSI_RESPONSE,
  shouldFail = false,
): typeof fetch {
  return async () => {
    if (shouldFail) {
      return new Response("Internal Server Error", { status: 500 });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

export function createMockPsiClient(
  metrics: PsiMetrics | null = {
    performanceScore: 72,
    lcp: 2.8,
    cls: 0.12,
    seoScore: 81,
  },
): PsiClient {
  return {
    async fetchMetrics() {
      return metrics;
    },
  };
}

export function createMockPsiClientFromResponse(
  response: PsiApiResponse = MOCK_PSI_RESPONSE,
  apiKey = "test-psi-key",
): PsiClient {
  return createPsiClient(createMockPsiFetch(response), apiKey);
}

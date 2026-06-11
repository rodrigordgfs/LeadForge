import { parseEnv } from "@leadforge/shared";

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 500;

export interface PsiMetrics {
  performanceScore: number;
  lcp: number;
  cls: number;
  seoScore: number;
}

export interface PsiApiResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number | null };
      seo?: { score?: number | null };
    };
    audits?: {
      "largest-contentful-paint"?: { numericValue?: number | null };
      "cumulative-layout-shift"?: { numericValue?: number | null };
    };
  };
}

let dailyCallCount = 0;
let dailyCallDate = new Date().toDateString();

export function resetPsiDailyCounter(): void {
  dailyCallCount = 0;
  dailyCallDate = new Date().toDateString();
}

export function getPsiDailyCallCount(): number {
  const today = new Date().toDateString();
  if (today !== dailyCallDate) {
    dailyCallDate = today;
    dailyCallCount = 0;
  }

  return dailyCallCount;
}

function incrementPsiDailyCallCount(): number {
  const today = new Date().toDateString();
  if (today !== dailyCallDate) {
    dailyCallDate = today;
    dailyCallCount = 0;
  }

  dailyCallCount += 1;
  return dailyCallCount;
}

function toScore(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }

  return Math.round(value * 100);
}

export function parsePsiResponse(response: PsiApiResponse): PsiMetrics | null {
  const lighthouse = response.lighthouseResult;
  if (!lighthouse) {
    return null;
  }

  const performanceScore = toScore(lighthouse.categories?.performance?.score);
  const seoScore = toScore(lighthouse.categories?.seo?.score);
  const lcpMs = lighthouse.audits?.["largest-contentful-paint"]?.numericValue ?? 0;
  const cls = lighthouse.audits?.["cumulative-layout-shift"]?.numericValue ?? 0;

  return {
    performanceScore,
    lcp: Number((lcpMs / 1000).toFixed(2)),
    cls: Number(cls.toFixed(3)),
    seoScore,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PsiClient {
  fetchMetrics(url: string): Promise<PsiMetrics | null>;
}

export function createPsiClient(
  fetchImpl: typeof fetch = fetch,
  apiKey?: string,
): PsiClient {
  return {
    async fetchMetrics(url: string): Promise<PsiMetrics | null> {
      const key =
        apiKey ??
        (() => {
          const env = parseEnv(process.env);
          return env.success ? env.data.GOOGLE_PSI_API_KEY : undefined;
        })();

      if (!key) {
        return null;
      }

      incrementPsiDailyCallCount();

      let lastError: unknown;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const endpoint = new URL(PSI_ENDPOINT);
          endpoint.searchParams.set("url", url);
          endpoint.searchParams.set("strategy", "mobile");
          endpoint.searchParams.set("category", "performance");
          endpoint.searchParams.append("category", "seo");
          endpoint.searchParams.set("key", key);

          const response = await fetchImpl(endpoint.toString());

          if (!response.ok) {
            throw new Error(`PSI API returned ${response.status}`);
          }

          const payload = (await response.json()) as PsiApiResponse;
          return parsePsiResponse(payload);
        } catch (error) {
          lastError = error;

          if (attempt < MAX_RETRIES) {
            await sleep(INITIAL_BACKOFF_MS * 2 ** (attempt - 1));
          }
        }
      }

      console.warn("PSI fetch failed after retries:", lastError);
      return null;
    },
  };
}

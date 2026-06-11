import { fileURLToPath } from "node:url";
import { Worker } from "bullmq";
import {
  getRedisConnectionOptions,
  QUEUE_NAMES,
} from "@leadforge/queue";
import { PlaywrightMapsScraper } from "./scraper/maps-scraper.js";
import { createAnalyzeProcessorHandler } from "./processors/analyze-processor.js";
import { createSearchProcessorHandler } from "./processors/search-processor.js";

export { PlaywrightMapsScraper } from "./scraper/maps-scraper.js";
export type { PlaywrightMapsScraperOptions } from "./scraper/maps-scraper.js";
export { BrowserPool, SCRAPER_CONCURRENCY } from "./scraper/browser-pool.js";
export { applyPostFilters } from "./scraper/post-filters.js";
export { CaptchaDetectedError, BrowserPoolExhaustedError } from "./scraper/errors.js";
export { SELECTORS } from "./scraper/selector-map.js";

export { upsertLeadFromScraped } from "./services/lead-upsert.js";
export {
  processSearchJob,
  scrapeWithRetry,
  createSearchProcessorHandler,
} from "./processors/search-processor.js";
export type { SearchProcessorDeps } from "./processors/search-processor.js";

export { classifyUrl, normalizeUrl } from "./audit/url-classifier.js";
export type { UrlClassification } from "./audit/url-classifier.js";
export { checkSeoBasics } from "./audit/seo-checks.js";
export {
  PlaywrightSiteAuditor,
  buildProblemsAndOpportunities,
} from "./audit/playwright-auditor.js";
export {
  createPsiClient,
  parsePsiResponse,
  getPsiDailyCallCount,
  resetPsiDailyCounter,
} from "./audit/psi-client.js";
export type { PsiClient, PsiMetrics, PsiApiResponse } from "./audit/psi-client.js";
export {
  createMockPsiClient,
  createMockPsiClientFromResponse,
  createMockPsiFetch,
  MOCK_PSI_RESPONSE,
} from "./audit/psi-mock.js";
export {
  HybridSiteAuditor,
  mergeAuditResults,
  isUrlUnreachableInPhaseA,
} from "./audit/hybrid-auditor.js";
export type { MergedAuditResult } from "./audit/hybrid-auditor.js";

export { scoreLeadFromAudit } from "./services/score-lead.js";
export type { ScoredLeadResult, LeadDiagnosis } from "./services/score-lead.js";
export {
  maybeTriggerArtifactsPipeline,
  getUserHighOpportunityThreshold,
} from "./services/pipeline-trigger.js";
export type { PipelineTriggerResult } from "./services/pipeline-trigger.js";
export {
  processAnalyzeJob,
  createAnalyzeProcessorHandler,
} from "./processors/analyze-processor.js";
export type { AnalyzeProcessorDeps } from "./processors/analyze-processor.js";

export { createOpenAiClient } from "./artifacts/openai-client.js";
export type {
  OpenAiClient,
  OpenAiCompletionRequest,
  OpenAiCompletionResult,
} from "./artifacts/openai-client.js";
export { createMockOpenAiClient } from "./artifacts/openai-mock.js";
export {
  TextArtifactGenerator,
  formatCompanyTxt,
  formatAnalysisTxt,
  formatWebsiteBriefTxt,
} from "./artifacts/text-generator.js";
export type { GeneratedTextArtifacts } from "./artifacts/text-generator.js";
export {
  ParseError,
  parseStructuredResponse,
  companyTxtResponseSchema,
  analysisTxtResponseSchema,
} from "./artifacts/types.js";
export type { LeadPromptContext } from "./artifacts/types.js";

export interface WorkerHandles {
  searchWorker: Worker;
  analyzeWorker: Worker;
}

export function createWorkers(): WorkerHandles {
  const connection = getRedisConnectionOptions();
  const scraper = new PlaywrightMapsScraper();

  const searchWorker = new Worker(
    QUEUE_NAMES.search,
    createSearchProcessorHandler({ scraper }),
    { connection },
  );

  const analyzeWorker = new Worker(
    QUEUE_NAMES.analyze,
    createAnalyzeProcessorHandler(),
    { connection },
  );

  return { searchWorker, analyzeWorker };
}

export async function startWorkers(): Promise<WorkerHandles> {
  const workers = createWorkers();

  const shutdown = async () => {
    await workers.searchWorker.close();
    await workers.analyzeWorker.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return workers;
}

const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === fileURLToPath(process.argv[1]);

if (isMainModule) {
  startWorkers().catch((error) => {
    console.error("Failed to start LeadForge workers:", error);
    process.exit(1);
  });
}

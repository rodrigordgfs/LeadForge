import { parseEnv } from "@leadforge/shared";

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1_000;

export interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAiCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

export interface OpenAiCompletionResult {
  content: string;
  model: string;
  prompt: string;
}

export interface OpenAiClient {
  complete(request: OpenAiCompletionRequest): Promise<OpenAiCompletionResult>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function createOpenAiClient(
  fetchImpl: typeof fetch = fetch,
  apiKey?: string,
): OpenAiClient {
  return {
    async complete(request: OpenAiCompletionRequest): Promise<OpenAiCompletionResult> {
      const key =
        apiKey ??
        (() => {
          const env = parseEnv(process.env);
          return env.success ? env.data.OPENAI_API_KEY : undefined;
        })();

      if (!key) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const model = request.model ?? DEFAULT_MODEL;
      const temperature = request.temperature ?? DEFAULT_TEMPERATURE;
      const systemPrompt =
        request.systemPrompt ??
        "Você gera conteúdo estruturado em português do Brasil. Responda apenas com JSON válido.";

      const body = {
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.prompt },
        ],
      };

      let lastError: unknown;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

        try {
          const response = await fetchImpl(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
              await sleep(INITIAL_BACKOFF_MS * 2 ** (attempt - 1));
              continue;
            }

            throw new Error(`OpenAI API returned ${response.status}`);
          }

          const payload = (await response.json()) as {
            choices?: Array<{ message?: { content?: string | null } }>;
          };

          const content = payload.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error("OpenAI response missing content");
          }

          return {
            content,
            model,
            prompt: request.prompt,
          };
        } catch (error) {
          lastError = error;

          if (attempt < MAX_RETRIES) {
            await sleep(INITIAL_BACKOFF_MS * 2 ** (attempt - 1));
            continue;
          }
        } finally {
          clearTimeout(timeout);
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("OpenAI request failed");
    },
  };
}

import { describe, expect, it, vi } from "vitest";
import { createOpenAiClient } from "../src/artifacts/openai-client.js";

describe("openai client", () => {
  it("retries 3 times on 429 rate limit then throws", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("rate limited", { status: 429 }));

    const client = createOpenAiClient(fetchMock, "test-key");

    await expect(
      client.complete({ prompt: "test prompt" }),
    ).rejects.toThrow("OpenAI API returned 429");

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns parsed content on successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const client = createOpenAiClient(fetchMock, "test-key");
    const result = await client.complete({ prompt: "test prompt" });

    expect(result.content).toBe('{"ok":true}');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

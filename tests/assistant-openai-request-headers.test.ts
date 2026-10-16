import { afterEach, describe, expect, it, vi } from "vitest";

import { resetEnvFileLoader } from "@/scripts/assistant/db/load-env.mjs";
import {
  EXPECTED_EMBEDDING_DIMENSIONS,
  SUPPORTED_EMBEDDING_MODEL,
} from "@/scripts/assistant/embeddings/index-config.mjs";
import { requestEmbeddingsBatch } from "@/scripts/assistant/embeddings/openai-embeddings.mjs";
import { requestChatCompletionJson } from "@/scripts/assistant/generation/openai-chat.mjs";
import {
  buildOpenAIRequestHeaders,
  resolveOpenAIProjectId,
} from "@/scripts/assistant/openai-request-headers.mjs";

function fakeVector(seed = 0) {
  return Array.from({ length: EXPECTED_EMBEDDING_DIMENSIONS }, (_, i) =>
    Number((seed + i * 0.001).toFixed(6)),
  );
}

describe("OpenAI request headers", () => {
  const previousProjectId = process.env.OPENAI_PROJECT_ID;

  afterEach(() => {
    resetEnvFileLoader();
    if (previousProjectId === undefined) {
      delete process.env.OPENAI_PROJECT_ID;
    } else {
      process.env.OPENAI_PROJECT_ID = previousProjectId;
    }
  });

  it("omits OpenAI-Project when OPENAI_PROJECT_ID is unset", () => {
    // Empty string blocks .env.local reload (loadEnvFiles only fills undefined keys).
    process.env.OPENAI_PROJECT_ID = "";
    resetEnvFileLoader();
    expect(resolveOpenAIProjectId()).toBeUndefined();
    const headers = buildOpenAIRequestHeaders("test-key");
    expect(headers).toEqual({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(headers).not.toHaveProperty("OpenAI-Project");
  });

  it("includes OpenAI-Project when OPENAI_PROJECT_ID is set", () => {
    process.env.OPENAI_PROJECT_ID = "proj_test_scope";
    resetEnvFileLoader();
    expect(resolveOpenAIProjectId()).toBe("proj_test_scope");
    const headers = buildOpenAIRequestHeaders("test-key");
    expect(headers["OpenAI-Project"]).toBe("proj_test_scope");
  });

  it("requestChatCompletionJson sends project header when configured", async () => {
    process.env.OPENAI_PROJECT_ID = "proj_chat_scope";
    resetEnvFileLoader();
    const fetch = vi.fn(async (_url, init) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers["OpenAI-Project"]).toBe("proj_chat_scope");
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  '{"claims":[],"support_level":"none","abstained":true,"abstention_reason":"other"}',
              },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
        { status: 200 },
      );
    });

    await requestChatCompletionJson({
      system: "Respond in json with claims array",
      user: "ping",
      apiKey: "test-key",
      fetch,
      maxRetries: 0,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("requestEmbeddingsBatch sends project header when configured", async () => {
    process.env.OPENAI_PROJECT_ID = "proj_embed_scope";
    resetEnvFileLoader();
    const vector = fakeVector();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers["OpenAI-Project"]).toBe("proj_embed_scope");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          object: "list",
          data: [{ object: "embedding", index: 0, embedding: vector }],
        }),
      };
    });
    const fetchFn = fetchMock as unknown as typeof fetch;

    const result = await requestEmbeddingsBatch({
      input: ["hello"],
      model: SUPPORTED_EMBEDDING_MODEL,
      apiKey: "test-key",
      fetch: fetchFn,
      maxRetries: 0,
    });
    expect(result).toEqual([vector]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requestEmbeddingsBatch omits project header when unset", async () => {
    process.env.OPENAI_PROJECT_ID = "";
    resetEnvFileLoader();
    const vector = fakeVector();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers["OpenAI-Project"]).toBeUndefined();
      return {
        ok: true,
        status: 200,
        json: async () => ({
          object: "list",
          data: [{ object: "embedding", index: 0, embedding: vector }],
        }),
      };
    });
    const fetchFn = fetchMock as unknown as typeof fetch;

    await requestEmbeddingsBatch({
      input: ["hello"],
      model: SUPPORTED_EMBEDDING_MODEL,
      apiKey: "test-key",
      fetch: fetchFn,
      maxRetries: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertEmbeddingDimensions,
  DEFAULT_EMBEDDING_BATCH_SIZE,
  EXPECTED_EMBEDDING_DIMENSIONS,
  SUPPORTED_EMBEDDING_MODEL,
  validateEmbeddingModel,
} from "@/scripts/assistant/embeddings/index-config.mjs";
import { resetEnvFileLoader } from "@/scripts/assistant/db/load-env.mjs";
import { resolveEmbeddingConfig } from "@/scripts/assistant/embeddings/embedding-config.mjs";
import {
  chunkTexts,
  embedTexts,
  parseEmbeddingsResponse,
  requestEmbeddingsBatch,
} from "@/scripts/assistant/embeddings/openai-embeddings.mjs";

function fakeVector(seed = 0) {
  return Array.from({ length: EXPECTED_EMBEDDING_DIMENSIONS }, (_, i) =>
    Number((seed + i * 0.001).toFixed(6)),
  );
}

function embeddingsJson(vectors: number[][]) {
  return {
    object: "list",
    data: vectors.map((embedding, index) => ({
      object: "embedding",
      index,
      embedding,
    })),
  };
}

describe("embedding index config", () => {
  it("accepts the supported model", () => {
    expect(() =>
      validateEmbeddingModel(SUPPORTED_EMBEDDING_MODEL),
    ).not.toThrow();
  });

  it("rejects unsupported models", () => {
    expect(() => validateEmbeddingModel("text-embedding-ada-002")).toThrow(
      /Unsupported ASSISTANT_EMBEDDING_MODEL/,
    );
  });

  it("rejects wrong dimension count", () => {
    expect(() => assertEmbeddingDimensions([1, 2, 3])).toThrow(
      /expected 1536 dimensions/,
    );
  });
});

describe("resolveEmbeddingConfig", () => {
  const previousModel = process.env.ASSISTANT_EMBEDDING_MODEL;
  const previousKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    resetEnvFileLoader();
    if (previousModel === undefined) {
      delete process.env.ASSISTANT_EMBEDDING_MODEL;
    } else {
      process.env.ASSISTANT_EMBEDDING_MODEL = previousModel;
    }
    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("defaults to the supported index model", () => {
    delete process.env.ASSISTANT_EMBEDDING_MODEL;
    const config = resolveEmbeddingConfig();
    expect(config.model).toBe(SUPPORTED_EMBEDDING_MODEL);
  });

  it("fails fast on unsupported ASSISTANT_EMBEDDING_MODEL", () => {
    process.env.ASSISTANT_EMBEDDING_MODEL = "text-embedding-3-large";
    expect(() => resolveEmbeddingConfig()).toThrow(/Unsupported/);
  });
});

describe("chunkTexts", () => {
  it("splits inputs into fixed-size batches", () => {
    const texts = Array.from({ length: 5 }, (_, i) => `t${i}`);
    expect(chunkTexts(texts, 2)).toEqual([["t0", "t1"], ["t2", "t3"], ["t4"]]);
  });
});

describe("parseEmbeddingsResponse", () => {
  it("rejects wrong dimension count from the API", () => {
    expect(() =>
      parseEmbeddingsResponse(embeddingsJson([[0.1, 0.2]]), 1),
    ).toThrow(/expected 1536 dimensions/);
  });
});

describe("requestEmbeddingsBatch", () => {
  it("propagates non-retryable API errors", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ error: { message: "invalid input" } }),
    });

    await expect(
      requestEmbeddingsBatch({
        input: ["hello"],
        model: SUPPORTED_EMBEDDING_MODEL,
        apiKey: "test-key",
        fetch,
        maxRetries: 0,
      }),
    ).rejects.toThrow(/invalid input/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors then succeeds", async () => {
    const vector = fakeVector();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({ error: { message: "rate limited" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => embeddingsJson([vector]),
      });

    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await requestEmbeddingsBatch({
      input: ["hello"],
      model: SUPPORTED_EMBEDDING_MODEL,
      apiKey: "test-key",
      fetch,
      maxRetries: 2,
      baseRetryDelayMs: 10,
      sleep,
    });

    expect(result).toEqual([vector]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(10);
  });
});

describe("embedTexts", () => {
  it("batches requests and preserves order", async () => {
    const texts = Array.from(
      { length: DEFAULT_EMBEDDING_BATCH_SIZE + 1 },
      (_, i) => `text-${i}`,
    );
    const vectors = texts.map((_, i) => fakeVector(i));

    const fetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const batchVectors = body.input.map((_: string, index: number) => {
        const globalIndex = texts.indexOf(body.input[index]);
        return vectors[globalIndex];
      });
      return {
        ok: true,
        status: 200,
        json: async () => embeddingsJson(batchVectors),
      };
    });

    const result = await embedTexts(texts, {
      apiKey: "test-key",
      fetch,
      batchSize: DEFAULT_EMBEDDING_BATCH_SIZE,
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(texts.length);
    expect(result[0]).toEqual(vectors[0]);
    expect(result.at(-1)).toEqual(vectors.at(-1));
  });
});

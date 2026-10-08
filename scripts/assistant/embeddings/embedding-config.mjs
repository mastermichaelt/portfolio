import { loadEnvFiles } from "../db/load-env.mjs";
import {
  SUPPORTED_EMBEDDING_MODEL,
  validateEmbeddingModel,
} from "./index-config.mjs";

/**
 * @typedef {{ apiKey: string | undefined, model: string }} EmbeddingConfig
 */

/**
 * Load OpenAI embedding settings from the environment (after `.env.local` / `.env`).
 * Validates the model against the fixed index config; does not require an API key
 * until a caller invokes the embeddings API.
 *
 * @returns {EmbeddingConfig}
 */
export function resolveEmbeddingConfig() {
  loadEnvFiles();
  const apiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
  const model =
    process.env.ASSISTANT_EMBEDDING_MODEL?.trim() || SUPPORTED_EMBEDDING_MODEL;
  validateEmbeddingModel(model);
  return { apiKey, model };
}

/**
 * @returns {string}
 */
export function requireOpenAIApiKey() {
  const { apiKey } = resolveEmbeddingConfig();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for assistant embedding tooling (see .env.example)",
    );
  }
  return apiKey;
}

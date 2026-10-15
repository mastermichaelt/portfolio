import { loadEnvFiles } from "../db/load-env.mjs";
import { DEFAULT_EVIDENCE_CHARACTER_BUDGET } from "./evidence-packet.mjs";

export const DEFAULT_GENERATION_MODEL = "gpt-4o-mini";
export const DEFAULT_GENERATION_TOP_K = 10;

/** Development default; production should set ASSISTANT_EVIDENCE_CHARACTER_BUDGET explicitly. */
export const DEV_DEFAULT_EVIDENCE_CHARACTER_BUDGET =
  DEFAULT_EVIDENCE_CHARACTER_BUDGET;

/** Heuristic chars-per-token for approximate prompt budgeting (not tokenizer-exact). */
export const APPROX_CHARS_PER_TOKEN = 4;

/**
 * @typedef {object} GenerationResourceConfig
 * @property {string} model
 * @property {number} topK
 * @property {number} evidenceCharacterBudget
 * @property {number} approximatePromptTokenBudget
 * @property {number} maxOutputTokens
 * @property {number} requestTimeoutMs
 * @property {number} maxQuestionLength
 * @property {number} maxModelResponseJsonChars
 */

/**
 * @param {string | undefined} raw
 * @param {string} name
 * @param {number} fallback
 * @returns {number}
 */
function parsePositiveIntEnv(raw, name, fallback) {
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer, received "${raw}"`);
  }
  return parsed;
}

/**
 * Load generation resource bounds from the environment (after `.env.local` / `.env`).
 *
 * @returns {GenerationResourceConfig}
 */
export function resolveGenerationConfig() {
  loadEnvFiles();

  const model =
    process.env.ASSISTANT_GENERATION_MODEL?.trim() || DEFAULT_GENERATION_MODEL;

  return {
    model,
    topK: parsePositiveIntEnv(
      process.env.ASSISTANT_GENERATION_TOP_K,
      "ASSISTANT_GENERATION_TOP_K",
      DEFAULT_GENERATION_TOP_K,
    ),
    evidenceCharacterBudget: parsePositiveIntEnv(
      process.env.ASSISTANT_EVIDENCE_CHARACTER_BUDGET,
      "ASSISTANT_EVIDENCE_CHARACTER_BUDGET",
      DEV_DEFAULT_EVIDENCE_CHARACTER_BUDGET,
    ),
    approximatePromptTokenBudget: parsePositiveIntEnv(
      process.env.ASSISTANT_GENERATION_PROMPT_TOKEN_BUDGET,
      "ASSISTANT_GENERATION_PROMPT_TOKEN_BUDGET",
      28_000,
    ),
    maxOutputTokens: parsePositiveIntEnv(
      process.env.ASSISTANT_GENERATION_MAX_OUTPUT_TOKENS,
      "ASSISTANT_GENERATION_MAX_OUTPUT_TOKENS",
      2_048,
    ),
    requestTimeoutMs: parsePositiveIntEnv(
      process.env.ASSISTANT_GENERATION_TIMEOUT_MS,
      "ASSISTANT_GENERATION_TIMEOUT_MS",
      120_000,
    ),
    maxQuestionLength: parsePositiveIntEnv(
      process.env.ASSISTANT_GENERATION_MAX_QUESTION_LENGTH,
      "ASSISTANT_GENERATION_MAX_QUESTION_LENGTH",
      4_000,
    ),
    maxModelResponseJsonChars: parsePositiveIntEnv(
      process.env.ASSISTANT_GENERATION_MAX_RESPONSE_JSON_CHARS,
      "ASSISTANT_GENERATION_MAX_RESPONSE_JSON_CHARS",
      24_000,
    ),
  };
}

/**
 * @param {string} system
 * @param {string} user
 * @param {number} tokenBudget
 * @returns {{ ok: true } | { ok: false, approximateTokens: number }}
 */
export function checkApproximatePromptTokenBudget(system, user, tokenBudget) {
  const chars = system.length + user.length;
  const approximateTokens = Math.ceil(chars / APPROX_CHARS_PER_TOKEN);
  if (approximateTokens > tokenBudget) {
    return { ok: false, approximateTokens };
  }
  return { ok: true };
}

import {
  EvidenceBudgetExceeded,
  GenerationParseError,
  GenerationValidationError,
  QueryValidationError,
} from "./errors.mjs";

/**
 * @typedef {'output_truncated' | 'output_too_large' | 'malformed_json' | 'structural_validation' | 'evidence_budget_exceeded' | 'query_validation' | 'prompt_budget_exceeded' | 'openai_timeout' | 'openai_api_error' | 'generation_empty_response' | 'public_envelope_validation' | 'unknown'} GenerationFailureCategory
 */

/**
 * @typedef {object} ClassifiedGenerationFailure
 * @property {GenerationFailureCategory} failure_category
 * @property {string | null} [finish_reason]
 * @property {number} [completion_tokens]
 * @property {number} [max_output_tokens]
 */

/**
 * @param {unknown} error
 * @param {{ maxOutputTokens?: number }} [context]
 * @returns {ClassifiedGenerationFailure}
 */
export function classifyGenerationFailure(error, context = {}) {
  const maxOutputTokens = context.maxOutputTokens;

  if (error instanceof GenerationParseError) {
    const details = error.details ?? {};
    if (details.finish_reason === "length") {
      return {
        failure_category: "output_truncated",
        finish_reason: "length",
        completion_tokens:
          typeof details.completion_tokens === "number"
            ? details.completion_tokens
            : undefined,
        max_output_tokens:
          typeof details.max_output_tokens === "number"
            ? details.max_output_tokens
            : maxOutputTokens,
      };
    }
    if (
      details.max !== undefined ||
      details.failure_category === "output_too_large"
    ) {
      return {
        failure_category: "output_too_large",
        max_output_tokens:
          typeof details.max_output_tokens === "number"
            ? details.max_output_tokens
            : maxOutputTokens,
      };
    }
    return { failure_category: "malformed_json", finish_reason: null };
  }

  if (error instanceof GenerationValidationError) {
    const message = error.message.toLowerCase();
    if (message.includes("prompt exceeds")) {
      return {
        failure_category: "prompt_budget_exceeded",
        finish_reason: null,
      };
    }
    return { failure_category: "structural_validation", finish_reason: null };
  }

  if (error instanceof QueryValidationError) {
    return { failure_category: "query_validation", finish_reason: null };
  }

  if (error instanceof EvidenceBudgetExceeded) {
    return {
      failure_category: "evidence_budget_exceeded",
      finish_reason: null,
    };
  }

  if (error instanceof Error) {
    if (error.message === "generation_empty_response") {
      return {
        failure_category: "generation_empty_response",
        finish_reason: null,
      };
    }
    if (error.message === "public_envelope_validation") {
      return {
        failure_category: "public_envelope_validation",
        finish_reason: null,
      };
    }
    if (error.message.includes("timed out after")) {
      return { failure_category: "openai_timeout", finish_reason: null };
    }
    if (error.message.includes("OpenAI chat request failed")) {
      return { failure_category: "openai_api_error", finish_reason: null };
    }
  }

  return { failure_category: "unknown", finish_reason: null };
}

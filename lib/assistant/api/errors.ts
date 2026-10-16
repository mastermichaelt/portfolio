import {
  EvidenceBudgetExceeded,
  GenerationParseError,
  GenerationValidationError,
  QueryValidationError,
} from "@/scripts/assistant/generation/errors.mjs";
import { classifyGenerationFailure } from "@/scripts/assistant/generation/classify-generation-failure.mjs";

export type AssistantApiErrorCode =
  | "method_not_allowed"
  | "invalid_json"
  | "request_too_large"
  | "invalid_request"
  | "rate_limited"
  | "service_unavailable"
  | "evidence_budget_exceeded"
  | "generation_failed"
  | "upstream_timeout"
  | "upstream_error";

export type AssistantApiErrorBody = {
  error: {
    code: AssistantApiErrorCode;
    message: string;
  };
};

export function jsonError(
  status: number,
  code: AssistantApiErrorCode,
  message: string,
  headers?: HeadersInit,
): Response {
  const body: AssistantApiErrorBody = { error: { code, message } };
  return Response.json(body, { status, headers });
}

export function mapGenerationErrorToResponse(error: unknown): Response {
  if (error instanceof QueryValidationError) {
    return jsonError(400, "invalid_request", "The question is invalid.");
  }

  if (error instanceof EvidenceBudgetExceeded) {
    return jsonError(
      503,
      "evidence_budget_exceeded",
      "The assistant cannot answer with the current evidence budget. Try a shorter or more specific question later.",
    );
  }

  const classified = classifyGenerationFailure(error);

  switch (classified.failure_category) {
    case "openai_timeout":
      return jsonError(
        504,
        "upstream_timeout",
        "The assistant took too long to respond. Please try again.",
      );
    case "openai_api_error":
      return jsonError(
        502,
        "upstream_error",
        "The assistant is temporarily unavailable. Please try again later.",
      );
    case "evidence_budget_exceeded":
      return jsonError(
        503,
        "evidence_budget_exceeded",
        "The assistant cannot answer with the current evidence budget. Try a shorter or more specific question later.",
      );
    case "prompt_budget_exceeded":
    case "output_truncated":
    case "output_too_large":
    case "malformed_json":
    case "structural_validation":
      return jsonError(
        502,
        "generation_failed",
        "The assistant could not produce a valid answer. Please try again.",
      );
    case "query_validation":
      return jsonError(400, "invalid_request", "The question is invalid.");
    default:
      if (
        error instanceof GenerationValidationError ||
        error instanceof GenerationParseError
      ) {
        return jsonError(
          502,
          "generation_failed",
          "The assistant could not produce a valid answer. Please try again.",
        );
      }

      if (error instanceof Error && error.message.includes("DATABASE_URL")) {
        return jsonError(
          503,
          "service_unavailable",
          "The assistant is temporarily unavailable. Please try again later.",
          { "Retry-After": "60" },
        );
      }

      return jsonError(
        500,
        "generation_failed",
        "The assistant could not complete your request. Please try again.",
      );
  }
}

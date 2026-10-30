import { createPool } from "@/scripts/assistant/db/client.mjs";
import { QueryValidationError } from "@/scripts/assistant/generation/errors.mjs";
import { resolveGenerationConfig } from "@/scripts/assistant/generation/generation-config.mjs";
import {
  readGenerationFailureDiagnostics,
  runRagGeneration,
} from "@/scripts/assistant/generation/run-generation.mjs";
import { validateAndNormalizeQuestion } from "@/scripts/assistant/generation/validate-query.mjs";
import type { Pool } from "pg";

import { resolveClientKeyFromHeaders } from "./client-key";
import {
  ASSISTANT_PUBLIC_DISABLED_MESSAGE,
  AssistantPublicEnabledConfigError,
  resolveAssistantApiConfig,
  resolveAssistantPublicEnabled,
} from "./config";
import { jsonError, mapGenerationErrorToResponse } from "./errors";
import {
  assertNoDisallowedPublicKeys,
  buildPublicAnswer,
  buildPublicUsageFromDiagnostics,
} from "./public-envelope";
import { buildEvidenceDisplayByCitationKey } from "./citation-display";
import { readBoundedUtf8Body } from "./read-request-body";
import { checkAssistantApiRateLimit } from "./rate-limit";
import {
  buildEvaluationRecordFromFailure,
  buildEvaluationRecordFromSuccess,
  type GenerationEvaluationInsert,
} from "@/lib/assistant/evaluation/build-record";
import { persistGenerationEvaluationSafely } from "@/lib/assistant/evaluation/persist";

export type AssistantGenerateRequestBody = {
  question?: unknown;
};

export type HandleAssistantGenerateDeps = {
  runRagGeneration: typeof runRagGeneration;
  createPool: (databaseUrl?: string) => Pool;
  resolvePublicEnabled: typeof resolveAssistantPublicEnabled;
  resolveConfig: typeof resolveAssistantApiConfig;
  checkRateLimit: typeof checkAssistantApiRateLimit;
  persistGenerationEvaluation: typeof persistGenerationEvaluationSafely;
};

const defaultDeps: HandleAssistantGenerateDeps = {
  runRagGeneration,
  createPool,
  resolvePublicEnabled: resolveAssistantPublicEnabled,
  resolveConfig: resolveAssistantApiConfig,
  checkRateLimit: checkAssistantApiRateLimit,
  persistGenerationEvaluation: persistGenerationEvaluationSafely,
};

function parseQuestionBody(
  body: AssistantGenerateRequestBody,
): string | Response {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError(
      400,
      "invalid_request",
      "Request body must be a JSON object.",
    );
  }

  if (body.question === undefined) {
    return jsonError(
      400,
      "invalid_request",
      "Missing required field: question.",
    );
  }

  if (typeof body.question !== "string") {
    return jsonError(
      400,
      "invalid_request",
      "Field question must be a string.",
    );
  }

  return body.question;
}

/**
 * Same semantic validation as {@link runRagGeneration} — run before durable rate limits.
 */
function validateApiQuestion(question: string): string {
  const { maxQuestionLength } = resolveGenerationConfig();
  return validateAndNormalizeQuestion(question, maxQuestionLength);
}

async function readJsonBody(
  request: Request,
  maxBodyBytes: number,
): Promise<AssistantGenerateRequestBody | Response> {
  const raw = await readBoundedUtf8Body(request, maxBodyBytes);
  if (raw instanceof Response) {
    return raw;
  }

  if (!raw.trim()) {
    return jsonError(400, "invalid_json", "Request body must be JSON.");
  }

  try {
    return JSON.parse(raw) as AssistantGenerateRequestBody;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

async function persistEvaluationTerminal(
  pool: Pool,
  deps: HandleAssistantGenerateDeps,
  evaluationState: { persisted: boolean },
  record: GenerationEvaluationInsert,
): Promise<void> {
  if (evaluationState.persisted) {
    return;
  }
  await deps.persistGenerationEvaluation(pool, record);
  evaluationState.persisted = true;
}

/**
 * POST /api/assistant/generate — thin adapter over {@link runRagGeneration}.
 */
export async function handleAssistantGeneratePost(
  request: Request,
  deps: HandleAssistantGenerateDeps = defaultDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError(405, "method_not_allowed", "Use POST for this endpoint.", {
      Allow: "POST",
    });
  }

  let publicEnabled: boolean;
  try {
    publicEnabled = deps.resolvePublicEnabled();
  } catch (error) {
    if (error instanceof AssistantPublicEnabledConfigError) {
      return jsonError(
        500,
        "generation_failed",
        "The assistant could not complete your request. Please try again.",
      );
    }
    throw error;
  }

  if (!publicEnabled) {
    return jsonError(
      503,
      "service_unavailable",
      ASSISTANT_PUBLIC_DISABLED_MESSAGE,
      { "Retry-After": "3600" },
    );
  }

  const config = deps.resolveConfig();

  const parsedBody = await readJsonBody(request, config.maxBodyBytes);
  if (parsedBody instanceof Response) {
    return parsedBody;
  }

  const question = parseQuestionBody(parsedBody);
  if (question instanceof Response) {
    return question;
  }

  let normalizedQuestion: string;
  try {
    normalizedQuestion = validateApiQuestion(question);
  } catch (error) {
    if (error instanceof QueryValidationError) {
      return mapGenerationErrorToResponse(error);
    }
    throw error;
  }

  const clientKey = resolveClientKeyFromHeaders(request.headers);
  let pool: Pool | undefined;
  let acceptedForEvaluation = false;
  const evaluationState = { persisted: false };

  try {
    pool = deps.createPool();

    const rateLimit = await deps.checkRateLimit(pool, clientKey, config);
    if (!rateLimit.allowed) {
      const message =
        rateLimit.window === "storage_unavailable"
          ? "The assistant is temporarily unavailable. Please try again later."
          : "Too many requests. Please wait before trying again.";
      const code =
        rateLimit.window === "storage_unavailable"
          ? "service_unavailable"
          : "rate_limited";
      const status = code === "rate_limited" ? 429 : 503;

      return jsonError(status, code, message, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      });
    }

    acceptedForEvaluation = true;

    const result = await deps.runRagGeneration({
      question: normalizedQuestion,
      executionContext: "api",
      pool,
    });

    if (!result.response) {
      await persistEvaluationTerminal(
        pool,
        deps,
        evaluationState,
        buildEvaluationRecordFromFailure({
          question: normalizedQuestion,
          error: new Error("generation_empty_response"),
          packet: result.packet,
          diagnostics: result.diagnostics,
        }),
      );
      return jsonError(
        502,
        "generation_failed",
        "The assistant could not produce a valid answer. Please try again.",
      );
    }

    try {
      await result.flushTelemetry();

      const displayByKey = buildEvidenceDisplayByCitationKey(
        result.packet.entries,
      );
      const answer = buildPublicAnswer(result.response, displayByKey);
      const usage = buildPublicUsageFromDiagnostics(result.diagnostics);
      const payload = usage ? { answer, usage } : { answer };

      const violations = assertNoDisallowedPublicKeys(payload);
      if (violations.length > 0) {
        await persistEvaluationTerminal(
          pool,
          deps,
          evaluationState,
          buildEvaluationRecordFromFailure({
            question: normalizedQuestion,
            error: new Error("public_envelope_validation"),
            packet: result.packet,
            diagnostics: result.diagnostics,
          }),
        );
        return jsonError(
          500,
          "generation_failed",
          "The assistant could not complete your request. Please try again.",
        );
      }

      await persistEvaluationTerminal(
        pool,
        deps,
        evaluationState,
        buildEvaluationRecordFromSuccess({
          question: normalizedQuestion,
          response: result.response,
          packet: result.packet,
          diagnostics: result.diagnostics,
        }),
      );

      return Response.json(payload, { status: 200 });
    } catch (postGenerationError) {
      await persistEvaluationTerminal(
        pool,
        deps,
        evaluationState,
        buildEvaluationRecordFromFailure({
          question: normalizedQuestion,
          error: postGenerationError,
          packet: result.packet,
          diagnostics: result.diagnostics,
        }),
      );
      return jsonError(
        500,
        "generation_failed",
        "The assistant could not complete your request. Please try again.",
      );
    }
  } catch (error) {
    if (pool && acceptedForEvaluation && !evaluationState.persisted) {
      await persistEvaluationTerminal(
        pool,
        deps,
        evaluationState,
        buildEvaluationRecordFromFailure({
          question: normalizedQuestion,
          error,
          diagnostics: readGenerationFailureDiagnostics(error),
        }),
      );
    }
    return mapGenerationErrorToResponse(error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

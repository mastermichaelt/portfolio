import { createAssistantDb } from "../db/app-client.mjs";
import { createPool, getDatabaseUrl } from "../db/client.mjs";
import { embedTexts } from "../embeddings/openai-embeddings.mjs";
import { searchRetrievalUnits } from "../retrieve/search.mjs";
import { classifyGenerationFailure } from "./classify-generation-failure.mjs";
import { fetchParentUnitsForConcept } from "./fetch-parent-units.mjs";
import { assembleEvidencePacket, ASSEMBLY_MODES } from "./evidence-packet.mjs";
import { GenerationParseError, GenerationValidationError } from "./errors.mjs";
import {
  checkApproximatePromptTokenBudget,
  resolveGenerationConfig,
} from "./generation-config.mjs";
import {
  createGenerationTelemetry,
  flattenAttributionCounts,
  outputTokenUtilization,
} from "./generation-telemetry.mjs";
import { requestChatCompletionJson } from "./openai-chat.mjs";
import {
  buildGenerationMessages,
  buildGenerationRetryUserMessage,
} from "./prompt-templates.mjs";
import {
  logGenerationRecoveryDiagnostics,
  resolveValidatedModelResponse,
} from "./recover-generation-response.mjs";
import { repairAssistantModelGenerationJson } from "./repair-model-response.mjs";
import {
  buildPublicGenerationResponse,
  countAttributions,
} from "./response-schema.mjs";
import { validateAndNormalizeQuestion } from "./validate-query.mjs";

/**
 * Per-completion canonical total for aggregation.
 * When both components exist, they define the pass total (even if provider total_tokens differs).
 * Otherwise use reported total_tokens when present.
 *
 * @param {{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number } | undefined} usage
 * @returns {number | undefined}
 */
function canonicalPassTotalForUsage(usage) {
  if (!usage) {
    return undefined;
  }
  const prompt = usage.prompt_tokens;
  const completion = usage.completion_tokens;
  if (typeof prompt === "number" && typeof completion === "number") {
    return prompt + completion;
  }
  if (typeof usage.total_tokens === "number") {
    return usage.total_tokens;
  }
  return undefined;
}

/**
 * True when a pass reports total_tokens without both component counts.
 *
 * @param {{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number } | undefined} usage
 * @returns {boolean}
 */
function passReportsTotalOnlyMetadata(usage) {
  if (!usage || typeof usage.total_tokens !== "number") {
    return false;
  }
  return (
    typeof usage.prompt_tokens !== "number" ||
    typeof usage.completion_tokens !== "number"
  );
}

/**
 * Sums OpenAI usage across two completion passes (initial + corrective retry).
 *
 * **Aggregation policy**
 * - Sum `prompt_tokens` and `completion_tokens` independently when reported.
 * - Per pass, canonical total = components sum when both exist; else `total_tokens`.
 * - Cumulative `total_tokens` = sum of per-pass canonical totals when any exist.
 * - When every pass reports both components (no total-only pass), cumulative
 *   `total_tokens` is set to cumulative prompt + completion so fields stay consistent.
 * - When any pass is total-only, cumulative total keeps the summed pass totals even
 *   if that exceeds cumulative components (partial provider metadata, not zero-filled).
 * - Missing fields are omitted — never treated as zero.
 *
 * @param {{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }} first
 * @param {{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }} second
 * @returns {{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }}
 */
export function accumulateChatCompletionUsage(first, second) {
  /** @type {{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }} */
  const accumulated = {};
  const passes = [first, second];

  let promptTokens;
  let completionTokens;
  let totalFromPasses = 0;
  let passTotalCount = 0;
  let anyTotalOnlyPass = false;
  let everyPassHasBothComponents = true;

  for (const usage of passes) {
    if (typeof usage?.prompt_tokens === "number") {
      promptTokens = (promptTokens ?? 0) + usage.prompt_tokens;
    }
    if (typeof usage?.completion_tokens === "number") {
      completionTokens = (completionTokens ?? 0) + usage.completion_tokens;
    }

    const passTotal = canonicalPassTotalForUsage(usage);
    if (typeof passTotal === "number") {
      totalFromPasses += passTotal;
      passTotalCount += 1;
    }

    if (passReportsTotalOnlyMetadata(usage)) {
      anyTotalOnlyPass = true;
    }
    if (
      typeof usage?.prompt_tokens !== "number" ||
      typeof usage?.completion_tokens !== "number"
    ) {
      everyPassHasBothComponents = false;
    }
  }

  if (typeof promptTokens === "number") {
    accumulated.prompt_tokens = promptTokens;
  }
  if (typeof completionTokens === "number") {
    accumulated.completion_tokens = completionTokens;
  }

  if (passTotalCount > 0) {
    accumulated.total_tokens = totalFromPasses;
  }

  if (
    typeof promptTokens === "number" &&
    typeof completionTokens === "number" &&
    everyPassHasBothComponents &&
    !anyTotalOnlyPass
  ) {
    accumulated.total_tokens = promptTokens + completionTokens;
  }

  return accumulated;
}

/**
 * @param {import("./response-schema.mjs").AssistantGenerationDiagnostics} diagnostics
 * @param {import("./recover-generation-response.mjs").RecoveryDiagnostics} recovery
 */
function applyRecoveryDiagnostics(diagnostics, recovery) {
  if (recovery.deterministic_repair_applied) {
    diagnostics.recovery_deterministic_repair_applied = true;
  }
  if (recovery.model_retry_attempted) {
    diagnostics.recovery_model_retry_attempted = true;
  }
  if (recovery.model_retry_succeeded) {
    diagnostics.recovery_model_retry_succeeded = true;
  }
  if (recovery.graceful_degradation_applied) {
    diagnostics.recovery_graceful_degradation_applied = true;
  }
  if (recovery.validation_stage) {
    diagnostics.recovery_validation_stage = recovery.validation_stage;
  }
  if (typeof recovery.validation_issue_count === "number") {
    diagnostics.recovery_validation_issue_count =
      recovery.validation_issue_count;
  }
  if (recovery.validation_issue_codes) {
    diagnostics.recovery_validation_issue_codes =
      recovery.validation_issue_codes;
  }
  if (typeof recovery.claims_removed_count === "number") {
    diagnostics.recovery_claims_removed_count = recovery.claims_removed_count;
  }
  if (typeof recovery.citations_normalized_count === "number") {
    diagnostics.recovery_citations_normalized_count =
      recovery.citations_normalized_count;
  }
}

/**
 * @param {{
 *   content: string,
 *   packet: import("./evidence-packet.mjs").EvidencePacket,
 *   recovery?: import("./recover-generation-response.mjs").RecoveryDiagnostics,
 * }} input
 */
function parseRepairAndResolveModelResponse(input) {
  let modelJson;
  try {
    modelJson = JSON.parse(input.content);
  } catch {
    /** @type {import("./recover-generation-response.mjs").RecoveryDiagnostics} */
    const meta = {
      deterministic_repair_applied:
        input.recovery?.deterministic_repair_applied ?? false,
      model_retry_attempted: input.recovery?.model_retry_attempted ?? false,
      model_retry_succeeded: input.recovery?.model_retry_succeeded ?? false,
      graceful_degradation_applied:
        input.recovery?.graceful_degradation_applied ?? false,
      validation_stage: "schema_parse",
      validation_issue_count: 1,
      validation_issue_codes: "schema",
    };
    return {
      ok: false,
      stage: "schema_parse",
      errors: ["Model response is not valid JSON"],
      recovery: meta,
    };
  }

  modelJson = repairAssistantModelGenerationJson(modelJson);
  return resolveValidatedModelResponse(modelJson, input.packet, input.recovery);
}

/** @typedef {import("./evidence-packet.mjs").AssemblyMode} AssemblyMode */
/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */
/** @typedef {import("./response-schema.mjs").AssistantGenerationResponse} AssistantGenerationResponse */
/** @typedef {import("./generation-telemetry.mjs").GenerationTelemetry} GenerationTelemetry */
/** @typedef {import("./generation-telemetry.mjs").GenerationExecutionContext} GenerationExecutionContext */

/**
 * @param {number} characterBudget
 * @param {AssemblyMode} assemblyMode
 * @returns {EvidencePacket}
 */
export function createEmptyEvidencePacket(characterBudget, assemblyMode) {
  return {
    assembly_mode: assemblyMode,
    matched_hits: [],
    entries: [],
    character_budget: characterBudget,
    character_count: 0,
    truncated: false,
  };
}

/**
 * @param {GenerationTelemetry} telemetry
 * @param {{ retrievalTelemetryEmitted: boolean }} state
 * @param {{
 *   skip: boolean,
 *   assemblyMode: AssemblyMode,
 *   topK: number,
 *   diagnostics: import("./response-schema.mjs").AssistantGenerationDiagnostics,
 * }} context
 */
function maybeEmitRetrievalTelemetry(telemetry, state, context) {
  if (context.skip || state.retrievalTelemetryEmitted) {
    return;
  }
  state.retrievalTelemetryEmitted = true;
  telemetry.capture("assistant_retrieval_completed", {
    assembly_mode: context.assemblyMode,
    top_k: context.topK,
    evidence_entry_count: context.diagnostics.evidence_entry_count ?? 0,
    evidence_character_count: context.diagnostics.evidence_character_count ?? 0,
    retrieval_latency_ms: context.diagnostics.retrieval_latency_ms ?? 0,
    assembly_latency_ms: context.diagnostics.assembly_latency_ms ?? 0,
  });
}

/**
 * @param {GenerationTelemetry} telemetry
 * @param {{
 *   failureTelemetryEmitted: boolean,
 *   truncationTelemetryEmitted: boolean,
 * }} state
 * @param {unknown} error
 * @param {{
 *   model: string,
 *   assemblyMode: AssemblyMode,
 *   maxOutputTokens: number,
 *   totalLatencyMs: number,
 *   generationLatencyMs?: number,
 * }} context
 */
function captureGenerationFailureTelemetry(telemetry, state, error, context) {
  if (state.failureTelemetryEmitted) {
    return;
  }
  state.failureTelemetryEmitted = true;

  const classified = classifyGenerationFailure(error, {
    maxOutputTokens: context.maxOutputTokens,
  });

  if (
    classified.failure_category === "output_truncated" &&
    !state.truncationTelemetryEmitted
  ) {
    state.truncationTelemetryEmitted = true;
    telemetry.capture("assistant_generation_truncated", {
      model: context.model,
      assembly_mode: context.assemblyMode,
      finish_reason: classified.finish_reason ?? "length",
      max_output_tokens: context.maxOutputTokens,
      completion_tokens: classified.completion_tokens,
    });
  }

  telemetry.capture("assistant_generation_failed", {
    model: context.model,
    assembly_mode: context.assemblyMode,
    failure_category: classified.failure_category,
    finish_reason: classified.finish_reason ?? undefined,
    total_latency_ms: context.totalLatencyMs,
    generation_latency_ms: context.generationLatencyMs,
    max_output_tokens: context.maxOutputTokens,
    completion_tokens: classified.completion_tokens,
  });
}

/**
 * @param {{
 *   question: string,
 *   assemblyMode?: AssemblyMode,
 *   topK?: number,
 *   noRetrieval?: boolean,
 *   dryRunRetrieval?: boolean,
 *   sourceClass?: string,
 *   pool?: import("pg").Pool,
 *   databaseUrl?: string,
 *   embedTexts?: typeof embedTexts,
 *   fetchParentUnits?: (conceptId: string) => Promise<import("./fetch-parent-units.mjs").ParentRetrievalUnitRow[]>,
 *   fetch?: typeof fetch,
 *   apiKey?: string,
 *   evidencePacket?: EvidencePacket,
 *   executionContext?: GenerationExecutionContext,
 *   telemetry?: GenerationTelemetry,
 *   config?: Partial<ReturnType<typeof resolveGenerationConfig>>,
 * }} options
 * @returns {Promise<{
 *   response?: AssistantGenerationResponse,
 *   packet: EvidencePacket,
 *   diagnostics: import("./response-schema.mjs").AssistantGenerationDiagnostics,
 *   flushTelemetry: () => Promise<void>,
 * }>}
 */
export async function runRagGeneration(options) {
  const runStarted = performance.now();
  const config = { ...resolveGenerationConfig(), ...options.config };
  const question = validateAndNormalizeQuestion(
    options.question,
    config.maxQuestionLength,
  );

  const assemblyMode = options.assemblyMode ?? "full_parent";
  if (!ASSEMBLY_MODES.includes(assemblyMode)) {
    throw new Error(
      `assemblyMode must be one of: ${ASSEMBLY_MODES.join(", ")}`,
    );
  }

  const topK = options.topK ?? config.topK;
  const noRetrieval = options.noRetrieval === true;

  const telemetry =
    options.telemetry ??
    createGenerationTelemetry({
      executionContext: options.executionContext ?? "cli",
    });

  const telemetryState = {
    retrievalTelemetryEmitted: false,
    failureTelemetryEmitted: false,
    truncationTelemetryEmitted: false,
  };

  const flushTelemetry = async () => {
    try {
      await telemetry.flush();
    } catch {
      // Fail-open — telemetry delivery must not affect generation results.
    }
  };

  /** @type {import("./response-schema.mjs").AssistantGenerationDiagnostics} */
  const diagnostics = {
    assembly_mode: assemblyMode,
    model: config.model,
    evidence_character_budget: config.evidenceCharacterBudget,
  };

  const skipRetrievalTelemetry =
    noRetrieval || options.evidencePacket !== undefined;

  const skipRetrieval = noRetrieval || options.evidencePacket !== undefined;
  const ownsPool = !options.pool && !skipRetrieval;
  const pool =
    options.pool ??
    (skipRetrieval
      ? undefined
      : createPool(options.databaseUrl ?? getDatabaseUrl()));
  const db = pool ? createAssistantDb(pool) : undefined;

  let packet;
  const retrievalStarted = performance.now();
  let generationLatencyMs;
  /** @type {number | undefined} */
  let generationStarted;

  try {
    if (options.evidencePacket) {
      packet = options.evidencePacket;
      diagnostics.retrieval_latency_ms = 0;
      diagnostics.assembly_latency_ms = 0;
      diagnostics.truncated = packet.truncated;
    } else if (noRetrieval) {
      packet = createEmptyEvidencePacket(
        config.evidenceCharacterBudget,
        assemblyMode,
      );
      diagnostics.retrieval_latency_ms = 0;
      diagnostics.assembly_latency_ms = 0;
    } else {
      const embedFn = options.embedTexts ?? embedTexts;
      const [queryEmbedding] = await embedFn([question]);
      if (!queryEmbedding) {
        throw new Error("Embedding API returned no vector for the question");
      }

      const hits = await searchRetrievalUnits(db, {
        queryEmbedding,
        topK,
        sourceClass: options.sourceClass,
      });

      diagnostics.retrieval_latency_ms = Math.round(
        performance.now() - retrievalStarted,
      );

      const assemblyStarted = performance.now();
      const fetchParentUnits =
        options.fetchParentUnits ??
        (async (conceptId) => fetchParentUnitsForConcept(db, conceptId));

      packet = await assembleEvidencePacket({
        matchedHits: hits,
        assemblyMode,
        characterBudget: config.evidenceCharacterBudget,
        fetchParentUnits,
      });

      diagnostics.assembly_latency_ms = Math.round(
        performance.now() - assemblyStarted,
      );
      diagnostics.truncated = packet.truncated;
    }

    diagnostics.evidence_entry_count = packet.entries.length;
    diagnostics.evidence_character_count = packet.character_count;

    maybeEmitRetrievalTelemetry(telemetry, telemetryState, {
      skip: skipRetrievalTelemetry,
      assemblyMode,
      topK,
      diagnostics,
    });

    if (options.dryRunRetrieval) {
      diagnostics.total_latency_ms = Math.round(performance.now() - runStarted);
      return { packet, diagnostics, flushTelemetry };
    }

    const messages = buildGenerationMessages(question, packet);
    const promptBudget = checkApproximatePromptTokenBudget(
      messages.system,
      messages.user,
      config.approximatePromptTokenBudget,
    );
    if (!promptBudget.ok) {
      throw new GenerationValidationError(
        `Prompt exceeds approximate token budget (${promptBudget.approximateTokens} > ${config.approximatePromptTokenBudget})`,
      );
    }

    generationStarted = performance.now();
    /** @type {import("./recover-generation-response.mjs").RecoveryDiagnostics} */
    let recoveryMeta = {
      deterministic_repair_applied: false,
      model_retry_attempted: false,
      model_retry_succeeded: false,
      graceful_degradation_applied: false,
    };

    const runCompletionPass = async (userMessage) => {
      return requestChatCompletionJson({
        system: messages.system,
        user: userMessage,
        model: config.model,
        maxOutputTokens: config.maxOutputTokens,
        requestTimeoutMs: config.requestTimeoutMs,
        maxModelResponseJsonChars: config.maxModelResponseJsonChars,
        fetch: options.fetch,
        apiKey: options.apiKey,
      });
    };

    let completion = await runCompletionPass(messages.user);
    const initialCompletion = completion;
    let resolved = parseRepairAndResolveModelResponse({
      content: completion.content,
      packet,
      recovery: recoveryMeta,
    });

    /** @type {typeof completion | undefined} */
    let retryCompletion;
    if (!resolved.ok) {
      recoveryMeta.model_retry_attempted = true;
      const retryUser = buildGenerationRetryUserMessage(
        messages.user,
        resolved.errors,
      );
      try {
        retryCompletion = await runCompletionPass(retryUser);
        const retryResolved = parseRepairAndResolveModelResponse({
          content: retryCompletion.content,
          packet,
          recovery: {
            ...recoveryMeta,
            model_retry_attempted: true,
          },
        });
        if (retryResolved.ok) {
          recoveryMeta = {
            ...retryResolved.recovery,
            model_retry_attempted: true,
            model_retry_succeeded: true,
          };
          resolved = retryResolved;
          completion = retryCompletion;
        } else {
          recoveryMeta = retryResolved.recovery;
          logGenerationRecoveryDiagnostics(recoveryMeta, retryResolved.errors);
        }
      } catch (retryError) {
        logGenerationRecoveryDiagnostics(recoveryMeta, resolved.errors);
        throw retryError;
      }
    }

    if (!resolved.ok) {
      logGenerationRecoveryDiagnostics(recoveryMeta, resolved.errors);
      if (
        resolved.errors.some((error) =>
          error.includes("Model response is not valid JSON"),
        )
      ) {
        throw new GenerationParseError("Model response is not valid JSON");
      }
      throw new GenerationValidationError(
        "Model response failed validation after recovery",
        resolved.errors,
      );
    }

    recoveryMeta = {
      ...resolved.recovery,
      model_retry_attempted:
        recoveryMeta.model_retry_attempted ||
        resolved.recovery.model_retry_attempted,
      model_retry_succeeded:
        recoveryMeta.model_retry_succeeded ||
        resolved.recovery.model_retry_succeeded,
      deterministic_repair_applied:
        recoveryMeta.deterministic_repair_applied ||
        resolved.recovery.deterministic_repair_applied,
      graceful_degradation_applied:
        recoveryMeta.graceful_degradation_applied ||
        resolved.recovery.graceful_degradation_applied,
    };
    applyRecoveryDiagnostics(diagnostics, recoveryMeta);
    if (
      recoveryMeta.deterministic_repair_applied ||
      recoveryMeta.graceful_degradation_applied ||
      recoveryMeta.model_retry_attempted
    ) {
      logGenerationRecoveryDiagnostics(recoveryMeta);
    }

    generationLatencyMs = Math.round(performance.now() - generationStarted);
    diagnostics.generation_latency_ms = generationLatencyMs;
    diagnostics.model = completion.model;
    const usageForDiagnostics =
      recoveryMeta.model_retry_succeeded && retryCompletion
        ? accumulateChatCompletionUsage(
            initialCompletion.usage,
            retryCompletion.usage,
          )
        : completion.usage;
    diagnostics.prompt_tokens = usageForDiagnostics.prompt_tokens;
    diagnostics.completion_tokens = usageForDiagnostics.completion_tokens;
    diagnostics.total_tokens = usageForDiagnostics.total_tokens;

    const response = buildPublicGenerationResponse(resolved.model);
    diagnostics.attribution_counts = countAttributions(response.claims);
    diagnostics.total_latency_ms = Math.round(performance.now() - runStarted);

    const utilization = outputTokenUtilization(
      completion.usage?.completion_tokens,
      config.maxOutputTokens,
    );

    telemetry.capture("assistant_generation_completed", {
      model: diagnostics.model ?? config.model,
      assembly_mode: assemblyMode,
      support_level: response.support_level,
      abstained: response.abstained,
      claim_count: response.claims.length,
      ...flattenAttributionCounts(diagnostics.attribution_counts ?? {}),
      prompt_tokens: diagnostics.prompt_tokens,
      completion_tokens: diagnostics.completion_tokens,
      total_tokens: diagnostics.total_tokens,
      max_output_tokens: config.maxOutputTokens,
      output_token_utilization: utilization,
      retrieval_latency_ms: diagnostics.retrieval_latency_ms,
      assembly_latency_ms: diagnostics.assembly_latency_ms,
      generation_latency_ms: diagnostics.generation_latency_ms,
      total_latency_ms: diagnostics.total_latency_ms,
      evidence_entry_count: diagnostics.evidence_entry_count,
      evidence_character_count: diagnostics.evidence_character_count,
      recovery_deterministic_repair_applied:
        diagnostics.recovery_deterministic_repair_applied === true,
      recovery_model_retry_attempted:
        diagnostics.recovery_model_retry_attempted === true,
      recovery_model_retry_succeeded:
        diagnostics.recovery_model_retry_succeeded === true,
      recovery_graceful_degradation_applied:
        diagnostics.recovery_graceful_degradation_applied === true,
      recovery_validation_stage: diagnostics.recovery_validation_stage,
      recovery_validation_issue_count:
        diagnostics.recovery_validation_issue_count,
      recovery_validation_issue_codes:
        diagnostics.recovery_validation_issue_codes,
    });

    return { response, packet, diagnostics, flushTelemetry };
  } catch (error) {
    if (
      typeof generationLatencyMs !== "number" &&
      typeof generationStarted === "number"
    ) {
      generationLatencyMs = Math.round(performance.now() - generationStarted);
    }
    if (!telemetryState.failureTelemetryEmitted) {
      captureGenerationFailureTelemetry(telemetry, telemetryState, error, {
        model: config.model,
        assemblyMode,
        maxOutputTokens: config.maxOutputTokens,
        totalLatencyMs: Math.round(performance.now() - runStarted),
        generationLatencyMs,
      });
    }
    try {
      await telemetry.flush();
    } catch {
      // Fail-open — telemetry must not mask generation errors.
    }
    throw error;
  } finally {
    if (ownsPool && pool) {
      await pool.end();
    }
  }
}

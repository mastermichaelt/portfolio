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
import { buildGenerationMessages } from "./prompt-templates.mjs";
import {
  buildPublicGenerationResponse,
  countAttributions,
  parseAssistantModelGenerationResponse,
} from "./response-schema.mjs";
import { validateAndNormalizeQuestion } from "./validate-query.mjs";
import { validateGenerationResponse } from "./validate-response.mjs";

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
      completion_tokens: classified.completion_tokens ?? 0,
    });
  }

  telemetry.capture("assistant_generation_failed", {
    model: context.model,
    assembly_mode: context.assemblyMode,
    failure_category: classified.failure_category,
    finish_reason: classified.finish_reason ?? "",
    total_latency_ms: context.totalLatencyMs,
    generation_latency_ms: context.generationLatencyMs ?? 0,
    max_output_tokens: context.maxOutputTokens,
    completion_tokens: classified.completion_tokens ?? 0,
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

      const hits = await searchRetrievalUnits(pool, {
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
        (async (conceptId) => fetchParentUnitsForConcept(pool, conceptId));

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
    const completion = await requestChatCompletionJson({
      system: messages.system,
      user: messages.user,
      model: config.model,
      maxOutputTokens: config.maxOutputTokens,
      requestTimeoutMs: config.requestTimeoutMs,
      maxModelResponseJsonChars: config.maxModelResponseJsonChars,
      fetch: options.fetch,
      apiKey: options.apiKey,
    });

    generationLatencyMs = Math.round(performance.now() - generationStarted);
    diagnostics.generation_latency_ms = generationLatencyMs;
    diagnostics.model = completion.model;
    diagnostics.prompt_tokens = completion.usage.prompt_tokens;
    diagnostics.completion_tokens = completion.usage.completion_tokens;
    diagnostics.total_tokens = completion.usage.total_tokens;

    let modelJson;
    try {
      modelJson = JSON.parse(completion.content);
    } catch {
      throw new GenerationParseError("Model response is not valid JSON");
    }

    const parsedModel = parseAssistantModelGenerationResponse(modelJson);
    if (!parsedModel.ok) {
      throw new GenerationValidationError(
        "Model response failed structural parse",
        parsedModel.errors,
      );
    }

    const validation = validateGenerationResponse(parsedModel.value, packet);
    if (!validation.valid) {
      throw new GenerationValidationError(
        "Model response failed validation",
        validation.errors,
      );
    }

    const response = buildPublicGenerationResponse(parsedModel.value);
    diagnostics.attribution_counts = countAttributions(response.claims);
    diagnostics.total_latency_ms = Math.round(performance.now() - runStarted);

    const utilization = outputTokenUtilization(
      diagnostics.completion_tokens,
      config.maxOutputTokens,
    );

    telemetry.capture("assistant_generation_completed", {
      model: config.model,
      assembly_mode: assemblyMode,
      support_level: response.support_level,
      abstained: response.abstained,
      claim_count: response.claims.length,
      ...flattenAttributionCounts(diagnostics.attribution_counts ?? {}),
      prompt_tokens: diagnostics.prompt_tokens ?? 0,
      completion_tokens: diagnostics.completion_tokens ?? 0,
      total_tokens: diagnostics.total_tokens ?? 0,
      max_output_tokens: config.maxOutputTokens,
      output_token_utilization: utilization ?? 0,
      retrieval_latency_ms: diagnostics.retrieval_latency_ms ?? 0,
      assembly_latency_ms: diagnostics.assembly_latency_ms ?? 0,
      generation_latency_ms: diagnostics.generation_latency_ms ?? 0,
      total_latency_ms: diagnostics.total_latency_ms ?? 0,
      evidence_entry_count: diagnostics.evidence_entry_count ?? 0,
      evidence_character_count: diagnostics.evidence_character_count ?? 0,
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

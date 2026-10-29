import type { AssistantGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";
import { classifyGenerationFailure } from "@/scripts/assistant/generation/classify-generation-failure.mjs";
import { countAttributions } from "@/scripts/assistant/generation/response-schema.mjs";

import { extractEvidenceRefs } from "./extract-evidence-refs";

export type EvaluationStatus = "completed" | "abstained" | "failed";

export type GenerationEvaluationInsert = {
  completedAt: Date;
  status: EvaluationStatus;
  question: string;
  questionLength: number;
  answerText: string | null;
  supportLevel: string | null;
  abstained: boolean;
  abstentionReason: string | null;
  failureCategory: string | null;
  evidenceUnitIds: string[];
  evidenceIds: string[];
  retrievedEvidenceCount: number | null;
  attributionCounts: Record<string, number> | null;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  retrievalLatencyMs: number | null;
  assemblyLatencyMs: number | null;
  generationLatencyMs: number | null;
  totalLatencyMs: number | null;
};

type DiagnosticsLike = {
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  retrieval_latency_ms?: number;
  assembly_latency_ms?: number;
  generation_latency_ms?: number;
  total_latency_ms?: number;
  evidence_entry_count?: number;
  attribution_counts?: Record<string, number>;
};

type PacketLike = {
  entries?: Array<{ unit_id?: string; evidence_id?: string }>;
};

export function buildEvaluationRecordFromSuccess(options: {
  question: string;
  response: AssistantGenerationResponse;
  packet: PacketLike;
  diagnostics: DiagnosticsLike;
}): GenerationEvaluationInsert {
  const completedAt = new Date();
  const refs = extractEvidenceRefs({
    packet: options.packet,
    answer: {
      claims: options.response.claims,
      citations: options.response.citations,
    },
  });
  const attributionCounts =
    options.diagnostics.attribution_counts ??
    countAttributions(options.response.claims);

  const status: EvaluationStatus = options.response.abstained
    ? "abstained"
    : "completed";

  return {
    completedAt,
    status,
    question: options.question,
    questionLength: options.question.length,
    answerText: options.response.answer_text,
    supportLevel: options.response.support_level,
    abstained: options.response.abstained,
    abstentionReason: options.response.abstention_reason ?? null,
    failureCategory: null,
    evidenceUnitIds: refs.evidenceUnitIds,
    evidenceIds: refs.evidenceIds,
    retrievedEvidenceCount:
      options.diagnostics.evidence_entry_count ?? refs.retrievedEvidenceCount,
    attributionCounts,
    model: options.diagnostics.model ?? null,
    promptTokens: options.diagnostics.prompt_tokens ?? null,
    completionTokens: options.diagnostics.completion_tokens ?? null,
    totalTokens: options.diagnostics.total_tokens ?? null,
    retrievalLatencyMs: options.diagnostics.retrieval_latency_ms ?? null,
    assemblyLatencyMs: options.diagnostics.assembly_latency_ms ?? null,
    generationLatencyMs: options.diagnostics.generation_latency_ms ?? null,
    totalLatencyMs: options.diagnostics.total_latency_ms ?? null,
  };
}

export function buildEvaluationRecordFromFailure(options: {
  question: string;
  error: unknown;
  packet?: PacketLike;
  diagnostics?: DiagnosticsLike;
}): GenerationEvaluationInsert {
  const completedAt = new Date();
  const classified = classifyGenerationFailure(options.error);
  const packet = options.packet ?? { entries: [] };
  const refs = extractEvidenceRefs({ packet });

  return {
    completedAt,
    status: "failed",
    question: options.question,
    questionLength: options.question.length,
    answerText: null,
    supportLevel: null,
    abstained: false,
    abstentionReason: null,
    failureCategory: classified.failure_category,
    evidenceUnitIds: refs.evidenceUnitIds,
    evidenceIds: refs.evidenceIds,
    retrievedEvidenceCount:
      options.diagnostics?.evidence_entry_count ?? refs.retrievedEvidenceCount,
    attributionCounts: options.diagnostics?.attribution_counts ?? null,
    model: options.diagnostics?.model ?? null,
    promptTokens: options.diagnostics?.prompt_tokens ?? null,
    completionTokens: options.diagnostics?.completion_tokens ?? null,
    totalTokens: options.diagnostics?.total_tokens ?? null,
    retrievalLatencyMs: options.diagnostics?.retrieval_latency_ms ?? null,
    assemblyLatencyMs: options.diagnostics?.assembly_latency_ms ?? null,
    generationLatencyMs: options.diagnostics?.generation_latency_ms ?? null,
    totalLatencyMs: options.diagnostics?.total_latency_ms ?? null,
  };
}

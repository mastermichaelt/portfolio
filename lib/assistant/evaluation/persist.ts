import type { Pool } from "pg";

import { createAssistantDb } from "@/db/client";
import { assistantGenerationEvaluations } from "@/db/schema";

import type { GenerationEvaluationInsert } from "./build-record";
import { resolveEvaluationObservabilityConfig } from "./config";
import { deleteEvaluationsOlderThan } from "./review-queries";

export function warnEvaluationPersistenceFailure(message: string): void {
  console.warn(`[assistant-evaluation] ${message}`);
}

export async function insertGenerationEvaluation(
  pool: Pool,
  record: GenerationEvaluationInsert,
): Promise<string | null> {
  const config = resolveEvaluationObservabilityConfig();
  if (!config.enabled) {
    return null;
  }

  try {
    const db = createAssistantDb(pool);
    const rows = await db
      .insert(assistantGenerationEvaluations)
      .values({
        completedAt: record.completedAt,
        status: record.status,
        question: record.question,
        questionLength: record.questionLength,
        answerText: record.answerText,
        supportLevel: record.supportLevel,
        abstained: record.abstained,
        abstentionReason: record.abstentionReason,
        failureCategory: record.failureCategory,
        evidenceUnitIds: record.evidenceUnitIds,
        evidenceIds: record.evidenceIds,
        retrievedEvidenceCount: record.retrievedEvidenceCount,
        attributionCounts: record.attributionCounts,
        model: record.model,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        retrievalLatencyMs: record.retrievalLatencyMs,
        assemblyLatencyMs: record.assemblyLatencyMs,
        generationLatencyMs: record.generationLatencyMs,
        totalLatencyMs: record.totalLatencyMs,
      })
      .returning({ id: assistantGenerationEvaluations.id });

    return rows[0]?.id ?? null;
  } catch {
    warnEvaluationPersistenceFailure(
      "Failed to persist generation evaluation.",
    );
    return null;
  }
}

/**
 * Fail-open wrapper for API handlers — never throws.
 */
export async function persistGenerationEvaluationSafely(
  pool: Pool,
  record: GenerationEvaluationInsert,
): Promise<void> {
  try {
    await insertGenerationEvaluation(pool, record);
  } catch {
    warnEvaluationPersistenceFailure(
      "Unexpected error during evaluation persistence.",
    );
  }
}

export async function deleteExpiredGenerationEvaluations(
  pool: Pool,
  retentionDays: number,
  now: Date = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  return deleteEvaluationsOlderThan(pool, cutoff);
}

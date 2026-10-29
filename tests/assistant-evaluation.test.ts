import { describe, expect, it, vi } from "vitest";

import {
  buildEvaluationRecordFromFailure,
  buildEvaluationRecordFromSuccess,
} from "@/lib/assistant/evaluation/build-record";
import { resolveEvaluationObservabilityConfig } from "@/lib/assistant/evaluation/config";
import { extractEvidenceRefs } from "@/lib/assistant/evaluation/extract-evidence-refs";
import {
  deleteExpiredGenerationEvaluations,
  insertGenerationEvaluation,
  persistGenerationEvaluationSafely,
} from "@/lib/assistant/evaluation/persist";
import * as reviewQueries from "@/lib/assistant/evaluation/review-queries";

const minimalRecord = {
  completedAt: new Date(),
  status: "completed" as const,
  question: "Hi",
  questionLength: 2,
  answerText: "Hello",
  supportLevel: "full",
  abstained: false,
  abstentionReason: null,
  failureCategory: null,
  evidenceUnitIds: [] as string[],
  evidenceIds: [] as string[],
  retrievedEvidenceCount: 0,
  attributionCounts: null,
  model: null,
  promptTokens: null,
  completionTokens: null,
  totalTokens: null,
  retrievalLatencyMs: null,
  assemblyLatencyMs: null,
  generationLatencyMs: null,
  totalLatencyMs: null,
};

describe("assistant evaluation observability", () => {
  it("builds completed and abstained records", () => {
    const completed = buildEvaluationRecordFromSuccess({
      question: "What is Savepoints?",
      response: {
        claims: [
          {
            text: "Savepoints captures learnings.",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "u1" }],
          },
        ],
        support_level: "full",
        abstained: false,
        answer_text: "Savepoints captures learnings.",
        citations: [{ evidence_id: "E1", unit_id: "u1" }],
      },
      packet: { entries: [{ unit_id: "u1", evidence_id: "E1" }] },
      diagnostics: {
        model: "gpt-4o-mini",
        prompt_tokens: 10,
        total_latency_ms: 100,
        evidence_entry_count: 1,
      },
    });
    expect(completed.status).toBe("completed");
    expect(completed.evidenceUnitIds).toEqual(["u1"]);
    expect(completed.evidenceIds).toEqual(["E1"]);

    const abstained = buildEvaluationRecordFromSuccess({
      question: "Personal phone?",
      response: {
        claims: [],
        support_level: "none",
        abstained: true,
        abstention_reason: "unsupported_personal_claim",
        answer_text: "I cannot answer that.",
        citations: [],
      },
      packet: { entries: [] },
      diagnostics: {},
    });
    expect(abstained.status).toBe("abstained");
    expect(abstained.abstentionReason).toBe("unsupported_personal_claim");
  });

  it("builds failed records with failure category", () => {
    const record = buildEvaluationRecordFromFailure({
      question: "Broken?",
      error: new Error("unexpected"),
    });
    expect(record.status).toBe("failed");
    expect(record.failureCategory).toBe("unknown");
    expect(record.answerText).toBeNull();
  });

  it("deduplicates evidence refs from packet and answer", () => {
    const refs = extractEvidenceRefs({
      packet: {
        entries: [
          { unit_id: "u1", evidence_id: "E1" },
          { unit_id: "u1", evidence_id: "E1" },
        ],
      },
      answer: {
        claims: [
          {
            text: "x",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "u1" }],
          },
        ],
        citations: [{ evidence_id: "E2", unit_id: "u2" }],
      },
    });
    expect(refs.evidenceUnitIds).toEqual(["u1", "u2"]);
    expect(refs.evidenceIds).toEqual(["E1", "E2"]);
  });

  it("generation telemetry events omit raw question and answer fields", () => {
    const completedEvent = {
      model: "gpt-4o-mini",
      support_level: "full",
      abstained: false,
      claim_count: 2,
      prompt_tokens: 100,
      total_latency_ms: 900,
    };
    const failedEvent = {
      model: "gpt-4o-mini",
      failure_category: "structural_validation",
      total_latency_ms: 400,
    };
    for (const payload of [completedEvent, failedEvent]) {
      expect(Object.keys(payload)).not.toContain("question");
      expect(Object.keys(payload)).not.toContain("answer_text");
    }
  });

  it("defaults retention to 30 days", () => {
    const prev = process.env.ASSISTANT_EVALUATION_RETENTION_DAYS;
    delete process.env.ASSISTANT_EVALUATION_RETENTION_DAYS;
    expect(resolveEvaluationObservabilityConfig().retentionDays).toBe(30);
    if (prev === undefined) {
      delete process.env.ASSISTANT_EVALUATION_RETENTION_DAYS;
    } else {
      process.env.ASSISTANT_EVALUATION_RETENTION_DAYS = prev;
    }
  });

  it("persistGenerationEvaluationSafely does not throw when insert fails", async () => {
    const spy = vi
      .spyOn(
        await import("@/lib/assistant/evaluation/persist"),
        "insertGenerationEvaluation",
      )
      .mockRejectedValueOnce(new Error("db down"));

    await expect(
      persistGenerationEvaluationSafely({} as import("pg").Pool, minimalRecord),
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it("deleteExpiredGenerationEvaluations applies retention window", async () => {
    const spy = vi
      .spyOn(reviewQueries, "deleteEvaluationsOlderThan")
      .mockResolvedValueOnce(2);
    const now = new Date("2026-10-29T00:00:00.000Z");
    const count = await deleteExpiredGenerationEvaluations(
      {} as import("pg").Pool,
      30,
      now,
    );
    expect(count).toBe(2);
    const cutoff = spy.mock.calls[0]?.[1] as Date;
    expect(cutoff.getTime()).toBe(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    spy.mockRestore();
  });

  it("skips insert when evaluation disabled", async () => {
    const prevEnabled = process.env.ASSISTANT_EVALUATION_ENABLED;
    process.env.ASSISTANT_EVALUATION_ENABLED = "false";
    const id = await insertGenerationEvaluation(
      {} as import("pg").Pool,
      minimalRecord,
    );
    expect(id).toBeNull();
    if (prevEnabled === undefined) {
      delete process.env.ASSISTANT_EVALUATION_ENABLED;
    } else {
      process.env.ASSISTANT_EVALUATION_ENABLED = prevEnabled;
    }
  });
});

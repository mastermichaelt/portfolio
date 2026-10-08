import { describe, expect, it, vi } from "vitest";

import { EvidenceBudgetExceeded } from "@/scripts/assistant/generation/errors.mjs";
import {
  assembleEvidencePacket,
  characterCostForRetrievalText,
} from "@/scripts/assistant/generation/evidence-packet.mjs";
import { buildGenerationMessages } from "@/scripts/assistant/generation/prompt-templates.mjs";
import {
  assertAssistantGenerationResponse,
  parseAssistantGenerationResponse,
} from "@/scripts/assistant/generation/response-schema.mjs";
import {
  validateCitationIntegrity,
  validateCitationIntegrityForParsedResponse,
} from "@/scripts/assistant/generation/validate-response.mjs";

function hit(
  rank: number,
  unitId: string,
  conceptId: string,
  text: string,
  contentHash?: string,
) {
  return {
    rank,
    cosine_distance: 0.1 * rank,
    similarity: 1 - 0.1 * rank,
    unit_id: unitId,
    okf_concept_id: conceptId,
    source_class: "portfolio",
    type: "test",
    title: `Title ${unitId}`,
    resource: `https://example.test/${conceptId}`,
    retrieval_text: text,
    content_hash: contentHash ?? `hash-${unitId}`,
  };
}

function parentRow(
  unitId: string,
  conceptId: string,
  text: string,
  chunkIndex: number | null,
  contentHash?: string,
) {
  return {
    unit_id: unitId,
    okf_concept_id: conceptId,
    source_class: "portfolio",
    type: "test",
    title: `Title ${conceptId}`,
    resource: `https://example.test/${conceptId}`,
    retrieval_text: text,
    content_hash: contentHash ?? `hash-${unitId}`,
    sources: [],
    metadata: { chunk_index: chunkIndex },
    chunk_index: chunkIndex,
  };
}

describe("assistant generation evidence assembly", () => {
  it("assembles top_k_only packets in retrieval rank order", async () => {
    const matchedHits = [
      hit(1, "unit/a#intro", "a", "Alpha intro"),
      hit(2, "unit/b#intro", "b", "Beta intro"),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    expect(packet.assembly_mode).toBe("top_k_only");
    expect(packet.entries.map((e) => e.unit_id)).toEqual([
      "unit/a#intro",
      "unit/b#intro",
    ]);
    expect(packet.entries[0]?.evidence_id).toBe("E1");
    expect(packet.truncated).toBe(false);
    expect(packet.entries.every((e) => e.matched_retrieval)).toBe(true);
  });

  it("expands full_parent only for hit OKF concepts (not the whole corpus)", async () => {
    const matchedHits = [hit(1, "unit/concept-a#s1", "concept-a", "Hit chunk")];
    const fetchParentUnits = vi.fn(async (conceptId: string) => {
      if (conceptId === "concept-a") {
        return [
          parentRow("unit/concept-a#s1", "concept-a", "Hit chunk", 0),
          parentRow("unit/concept-a#s2", "concept-a", "Sibling chunk", 1),
        ];
      }
      if (conceptId === "concept-b") {
        return [
          parentRow("unit/concept-b#s1", "concept-b", "Other concept", 0),
        ];
      }
      return [];
    });

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: 10_000,
      fetchParentUnits,
    });

    expect(fetchParentUnits).toHaveBeenCalledTimes(1);
    expect(fetchParentUnits).toHaveBeenCalledWith("concept-a");
    expect(packet.entries.map((e) => e.unit_id)).toEqual([
      "unit/concept-a#s1",
      "unit/concept-a#s2",
    ]);
    expect(packet.entries[0]?.matched_retrieval).toBe(true);
    expect(packet.entries[1]?.matched_retrieval).toBe(false);
  });

  it("dedupes identical content_hash while preserving matched retrieval coverage", async () => {
    const matchedHits = [
      hit(1, "unit/x#intro", "x", "Shared body", "same-hash"),
    ];
    const fetchParentUnits = async () => [
      parentRow("unit/x#intro", "x", "Shared body", 0, "same-hash"),
      parentRow("unit/x#dup", "x", "Shared body", 1, "same-hash"),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: 10_000,
      fetchParentUnits,
    });

    expect(packet.entries).toHaveLength(1);
    expect(packet.entries[0]?.matched_retrieval).toBe(true);
  });

  it("truncates unmatched chunks only when over budget", async () => {
    const matchedHits = [hit(1, "unit/p#0", "p", "MATCH")];
    const fetchParentUnits = async () => [
      parentRow("unit/p#0", "p", "MATCH", 0),
      parentRow("unit/p#1", "p", "EXTRA-A", 1),
      parentRow("unit/p#2", "p", "EXTRA-B", 2),
    ];

    const matchedCost = characterCostForRetrievalText("MATCH");
    const extraACost = characterCostForRetrievalText("EXTRA-A");

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: matchedCost + extraACost,
      fetchParentUnits,
    });

    expect(packet.truncated).toBe(true);
    expect(packet.entries.map((e) => e.unit_id)).toEqual([
      "unit/p#0",
      "unit/p#1",
    ]);
    expect(packet.entries[0]?.matched_retrieval).toBe(true);
  });

  it("throws EvidenceBudgetExceeded when matched units alone exceed the budget", async () => {
    const matchedHits = [
      hit(1, "unit/big#0", "big", "AAAA"),
      hit(2, "unit/big#1", "big", "BBBB"),
    ];

    await expect(
      assembleEvidencePacket({
        matchedHits,
        assemblyMode: "top_k_only",
        characterBudget: 5,
      }),
    ).rejects.toBeInstanceOf(EvidenceBudgetExceeded);
  });

  it("orders parents by best retrieval rank in full_parent mode", async () => {
    const matchedHits = [
      hit(2, "unit/second#0", "second", "Second parent hit"),
      hit(1, "unit/first#0", "first", "First parent hit"),
    ];

    const fetchParentUnits = async (conceptId: string) => [
      parentRow(`unit/${conceptId}#0`, conceptId, `${conceptId} body`, 0),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: 10_000,
      fetchParentUnits,
    });

    expect(packet.entries.map((e) => e.okf_concept_id)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("assistant generation response schema", () => {
  it("parses valid structured responses", () => {
    const parsed = assertAssistantGenerationResponse({
      answer_text: "Grounded answer.",
      support_level: "partial",
      citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
      diagnostics: { assembly_mode: "full_parent", truncated: false },
    });

    expect(parsed.support_level).toBe("partial");
    expect(parsed.citations).toHaveLength(1);
  });

  it("rejects malformed responses", () => {
    const parsed = parseAssistantGenerationResponse({
      answer_text: "",
      support_level: "maybe",
      citations: "not-an-array",
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("assistant generation citation integrity", () => {
  it("accepts citations that reference the evidence packet registry", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const response = {
      answer_text: "Alpha detail.",
      support_level: "full",
      citations: [
        {
          evidence_id: packet.entries[0]!.evidence_id,
          unit_id: packet.entries[0]!.unit_id,
        },
      ],
    };

    const result = validateCitationIntegrity(response, packet);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects unknown evidence_id and unit_id mismatches", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const response = assertAssistantGenerationResponse({
      answer_text: "Wrong cite.",
      support_level: "full",
      citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
    });

    const unknown = validateCitationIntegrityForParsedResponse(
      response,
      packet,
    );
    expect(unknown.valid).toBe(false);
    expect(unknown.errors.join(" ")).toContain("unknown evidence_id");

    const mismatch = validateCitationIntegrityForParsedResponse(
      {
        ...response,
        citations: [{ evidence_id: "E1", unit_id: "unit/other" }],
      },
      packet,
    );
    expect(mismatch.valid).toBe(false);
    expect(mismatch.errors.join(" ")).toContain("does not match");
  });
});

describe("assistant generation prompt templates", () => {
  it("embeds evidence blocks with stable ids for the model", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const messages = buildGenerationMessages("What is Alpha?", packet);
    expect(messages.system).toContain("evidence packet");
    expect(messages.user).toContain("[E1]");
    expect(messages.user).toContain("Alpha body");
  });
});

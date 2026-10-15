import { describe, expect, it, vi } from "vitest";

import { EvidenceBudgetExceeded } from "@/scripts/assistant/generation/errors.mjs";
import {
  collectApprovedEvidenceUrls,
  extractHttpUrlsFromText,
} from "@/scripts/assistant/generation/approved-urls.mjs";
import {
  assembleEvidencePacket,
  characterCostForRetrievalText,
  dedupeCandidatesWithinConcept,
} from "@/scripts/assistant/generation/evidence-packet.mjs";
import { buildGenerationMessages } from "@/scripts/assistant/generation/prompt-templates.mjs";
import {
  assertAssistantGenerationResponse,
  buildPublicGenerationResponse,
  deriveAnswerTextFromClaims,
  deriveCitationsFromClaims,
  parseAssistantGenerationResponse,
  parseAssistantModelGenerationResponse,
} from "@/scripts/assistant/generation/response-schema.mjs";
import { validateStructuralModelResponse } from "@/scripts/assistant/generation/validate-response.mjs";
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

  it("dedupes unmatched identical content_hash only within an OKF concept", async () => {
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
    expect(packet.entries[0]?.unit_id).toBe("unit/x#intro");
    expect(packet.entries[0]?.matched_retrieval).toBe(true);
  });

  it("supersedes unmatched-first duplicate when matched sibling shares content_hash", async () => {
    const matchedHits = [
      hit(1, "unit/x#intro", "x", "Shared body", "same-hash"),
    ];
    const fetchParentUnits = async () => [
      parentRow("unit/x#dup", "x", "Shared body", 0, "same-hash"),
      parentRow("unit/x#intro", "x", "Shared body", 1, "same-hash"),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: 10_000,
      fetchParentUnits,
    });

    expect(packet.entries).toHaveLength(1);
    expect(packet.entries[0]?.unit_id).toBe("unit/x#intro");
    expect(packet.entries[0]?.matched_retrieval).toBe(true);
    expect(packet.character_count).toBe(
      characterCostForRetrievalText("Shared body"),
    );
  });

  it("keeps identical text from different OKF concepts as separate evidence entries", async () => {
    const sharedText = "Identical paragraph across concepts.";
    const sharedHash = "shared-hash";
    const matchedHits = [
      hit(1, "unit/concept-a#0", "concept-a", sharedText, sharedHash),
      hit(2, "unit/concept-b#0", "concept-b", sharedText, sharedHash),
    ];

    const fetchParentUnits = async (conceptId: string) => [
      parentRow(`unit/${conceptId}#0`, conceptId, sharedText, 0, sharedHash),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: 10_000,
      fetchParentUnits,
    });

    expect(packet.entries).toHaveLength(2);
    expect(packet.entries.map((e) => e.okf_concept_id)).toEqual([
      "concept-a",
      "concept-b",
    ]);
  });

  it("preserves distinct matched unit_id values that share a content_hash", async () => {
    const matchedHits = [
      hit(1, "unit/x#a", "x", "Same text", "dup-hash"),
      hit(2, "unit/x#b", "x", "Same text", "dup-hash"),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    expect(packet.entries.map((e) => e.unit_id)).toEqual([
      "unit/x#a",
      "unit/x#b",
    ]);
  });

  it("dedupeCandidatesWithinConcept never collapses two matched units with the same hash", () => {
    const conceptId = "x";
    const candidates = [
      {
        unit: parentRow("unit/x#a", conceptId, "Same", 0, "dup-hash"),
        matched: true,
        retrieval_rank: 1,
      },
      {
        unit: parentRow("unit/x#b", conceptId, "Same", 1, "dup-hash"),
        matched: true,
        retrieval_rank: 2,
      },
    ];

    const deduped = dedupeCandidatesWithinConcept(candidates);
    expect(deduped.map((c) => c.unit.unit_id)).toEqual([
      "unit/x#a",
      "unit/x#b",
    ]);
  });

  it("dedupeCandidatesWithinConcept supersedes unmatched-first hash duplicates", () => {
    const conceptId = "x";
    const deduped = dedupeCandidatesWithinConcept([
      {
        unit: parentRow("unit/x#dup", conceptId, "Same", 0, "dup-hash"),
        matched: false,
      },
      {
        unit: parentRow("unit/x#intro", conceptId, "Same", 1, "dup-hash"),
        matched: true,
        retrieval_rank: 1,
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.unit.unit_id).toBe("unit/x#intro");
    expect(deduped[0]?.matched).toBe(true);
  });

  it("preserves two matched units sharing a hash in full_parent expansion", async () => {
    const sharedText = "Same text";
    const sharedHash = "dup-hash";
    const matchedHits = [
      hit(1, "unit/x#a", "x", sharedText, sharedHash),
      hit(2, "unit/x#b", "x", sharedText, sharedHash),
    ];
    const fetchParentUnits = async () => [
      parentRow("unit/x#a", "x", sharedText, 0, sharedHash),
      parentRow("unit/x#b", "x", sharedText, 1, sharedHash),
    ];

    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: 10_000,
      fetchParentUnits,
    });

    expect(packet.entries.map((e) => e.unit_id)).toEqual([
      "unit/x#a",
      "unit/x#b",
    ]);
    expect(packet.character_count).toBe(
      characterCostForRetrievalText(sharedText) * 2,
    );
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
  const validModel = {
    claims: [
      {
        text: "Grounded answer.",
        attribution: "evidence_supported",
        citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
      },
    ],
    support_level: "partial",
    abstained: false,
  };

  it("parses valid claims-based model responses and derives public fields", () => {
    const parsed = assertAssistantGenerationResponse(validModel);

    expect(parsed.support_level).toBe("partial");
    expect(parsed.answer_text).toBe("Grounded answer.");
    expect(parsed.citations).toEqual([
      { evidence_id: "E1", unit_id: "unit/a#intro" },
    ]);
    expect(parsed.claims).toHaveLength(1);
  });

  it("derives answer_text and deduped citations from claims", () => {
    const claims = [
      {
        text: "First.",
        attribution: "general_knowledge" as const,
      },
      {
        text: "Second.",
        attribution: "evidence_supported" as const,
        citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
      },
      {
        text: "Third.",
        attribution: "evidence_inferred" as const,
        citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
      },
    ];
    expect(deriveAnswerTextFromClaims(claims)).toBe(
      "First.\n\nSecond.\n\nThird.",
    );
    expect(deriveCitationsFromClaims(claims)).toEqual([
      { evidence_id: "E1", unit_id: "unit/a#intro" },
    ]);
  });

  it("requires abstention_reason when abstained and forbids it otherwise", () => {
    const missingReason = parseAssistantModelGenerationResponse({
      ...validModel,
      abstained: true,
    });
    expect(missingReason.ok).toBe(false);

    const withReason = parseAssistantModelGenerationResponse({
      claims: [{ text: "Cannot say.", attribution: "uncertain" }],
      support_level: "none",
      abstained: true,
      abstention_reason: "unsupported_personal_claim",
    });
    expect(withReason.ok).toBe(true);

    const strayReason = parseAssistantModelGenerationResponse({
      ...validModel,
      abstention_reason: "other",
    });
    expect(strayReason.ok).toBe(false);
  });

  it("rejects malformed responses", () => {
    const parsed = parseAssistantGenerationResponse({
      claims: [],
      support_level: "maybe",
      abstained: "no",
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

    const response = buildPublicGenerationResponse({
      claims: [
        {
          text: "Alpha detail. See https://example.test/a for more.",
          attribution: "evidence_supported",
          citations: [
            {
              evidence_id: packet.entries[0]!.evidence_id,
              unit_id: packet.entries[0]!.unit_id,
            },
          ],
        },
      ],
      support_level: "full",
      abstained: false,
    });

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

    const response = buildPublicGenerationResponse({
      claims: [
        {
          text: "Wrong cite.",
          attribution: "evidence_supported",
          citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
        },
      ],
      support_level: "full",
      abstained: false,
    });

    const unknown = validateCitationIntegrityForParsedResponse(
      response,
      packet,
    );
    expect(unknown.valid).toBe(false);
    expect(unknown.errors.join(" ")).toContain("unknown evidence_id");

    const mismatch = validateCitationIntegrityForParsedResponse(
      buildPublicGenerationResponse({
        claims: [
          {
            text: "Wrong unit.",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "unit/other" }],
          },
        ],
        support_level: "full",
        abstained: false,
      }),
      packet,
    );
    expect(mismatch.valid).toBe(false);
    expect(mismatch.errors.join(" ")).toContain("does not match");
  });

  it("approves HTTP(S) URLs extracted from included entry retrieval_text", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [
        hit(
          1,
          "unit/a#intro",
          "a",
          "See https://example.test/in-body/ for the write-up.",
        ),
      ],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const approved = collectApprovedEvidenceUrls(packet);
    expect(approved.has("https://example.test/in-body")).toBe(true);

    const result = validateCitationIntegrity(
      buildPublicGenerationResponse({
        claims: [
          {
            text: "Cited from https://example.test/in-body.",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
          },
        ],
        support_level: "full",
        abstained: false,
      }),
      packet,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects URLs from truncated evidence chunks not in the assembled packet", async () => {
    const truncatedUrl = "https://example.test/truncated-only";
    const matchedHits = [hit(1, "unit/p#0", "p", "MATCH")];
    const fetchParentUnits = async () => [
      parentRow("unit/p#0", "p", "MATCH", 0),
      parentRow("unit/p#1", "p", `More at ${truncatedUrl}/`, 1),
    ];

    const matchedCost = characterCostForRetrievalText("MATCH");
    const packet = await assembleEvidencePacket({
      matchedHits,
      assemblyMode: "full_parent",
      characterBudget: matchedCost,
      fetchParentUnits,
    });

    expect(packet.truncated).toBe(true);
    expect(packet.entries).toHaveLength(1);
    expect(collectApprovedEvidenceUrls(packet).has(truncatedUrl)).toBe(false);

    const result = validateCitationIntegrity(
      buildPublicGenerationResponse({
        claims: [
          {
            text: `Excluded link ${truncatedUrl}.`,
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "unit/p#0" }],
          },
        ],
        support_level: "partial",
        abstained: false,
      }),
      packet,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("not in evidence packet");
  });

  it("rejects URLs in answer_text that are not present on evidence sources", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [
        {
          ...hit(1, "unit/a#intro", "a", "Alpha"),
          resource: "https://example.test/a",
          sources: [
            {
              id: "src-a",
              title: "Source A",
              resource: "https://example.test/source-a",
            },
          ],
        },
      ],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const approved = collectApprovedEvidenceUrls(packet);
    expect(approved.has("https://example.test/a")).toBe(true);
    expect(approved.has("https://example.test/source-a")).toBe(true);

    const allowed = validateCitationIntegrity(
      buildPublicGenerationResponse({
        claims: [
          {
            text: "Read https://example.test/source-a.",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
          },
        ],
        support_level: "full",
        abstained: false,
      }),
      packet,
    );
    expect(allowed.valid).toBe(true);

    const invented = validateCitationIntegrity(
      buildPublicGenerationResponse({
        claims: [
          {
            text: "See https://evil.example/phish for details.",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
          },
        ],
        support_level: "full",
        abstained: false,
      }),
      packet,
    );
    expect(invented.valid).toBe(false);
    expect(invented.errors.join(" ")).toContain("not in evidence packet");
  });

  it("extracts and normalizes HTTP URLs from answer text", () => {
    const urls = extractHttpUrlsFromText(
      "Link https://example.test/path/ and https://example.test/path.",
    );
    expect(urls).toEqual(["https://example.test/path"]);
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
    expect(messages.system).toContain("untrusted instructions");
    expect(messages.system).toContain("claims");
    expect(messages.user).toContain("[E1]");
    expect(messages.user).toContain("Alpha body");
  });
});

describe("assistant generation structural validation", () => {
  it("allows external URLs in general_knowledge claims without evidence allowlist", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const result = validateStructuralModelResponse(
      {
        claims: [
          {
            text: "See https://developer.mozilla.org/en-US/docs/Web/HTTP for HTTP basics.",
            attribution: "general_knowledge",
          },
        ],
        support_level: "none",
        abstained: false,
      },
      packet,
    );
    expect(result.valid).toBe(true);
  });

  it("requires citations for evidence_supported claims", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const result = validateStructuralModelResponse(
      {
        claims: [
          {
            text: "No cites.",
            attribution: "evidence_supported",
          },
        ],
        support_level: "partial",
        abstained: false,
      },
      packet,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("requires non-empty citations");
  });
});

/**
 * Generation eval harness — frozen packets, deterministic scorers (no LLM-as-judge).
 */

import { pathToFileURL } from "node:url";

import { parseAssistantModelGenerationResponse } from "./response-schema.mjs";
import { validateGenerationResponse } from "./validate-response.mjs";

/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */
/** @typedef {import("./response-schema.mjs").AssistantModelGenerationResponse} AssistantModelGenerationResponse */

export const GENERATION_EVAL_ASSEMBLY_MODES = /** @type {const} */ ([
  "no_retrieval",
  "top_k_only",
  "full_parent",
]);

/** @typedef {'no_retrieval' | 'top_k_only' | 'full_parent'} GenerationEvalAssemblyMode */

/**
 * @typedef {object} CitationSupportClaimExpectation
 * @property {number} claim_index
 * @property {string[]} required_evidence_substrings
 */

/**
 * @typedef {object} AttributionClaimExpectation
 * @property {number} claim_index
 * @property {import("./response-schema.mjs").ClaimAttribution} [expected_attribution]
 * @property {import("./response-schema.mjs").ClaimAttribution[]} [forbidden_attributions]
 * @property {string[]} [personal_markers]
 */

/**
 * @typedef {object} AbstentionExpectation
 * @property {boolean} abstained
 * @property {import("./response-schema.mjs").AbstentionReason} [abstention_reason]
 */

/**
 * @typedef {object} GenerationEvalSemanticExpectations
 * @property {CitationSupportClaimExpectation[]} [citation_support]
 * @property {AttributionClaimExpectation[]} [attribution_accuracy]
 * @property {AbstentionExpectation} [abstention]
 * @property {string[]} [forbidden_answer_substrings]
 */

/**
 * @typedef {object} GenerationEvalCase
 * @property {string} id
 * @property {string} question
 * @property {string} category
 * @property {Record<GenerationEvalAssemblyMode, string>} [packet_fixtures]
 * @property {string} [packet_fixture]
 * @property {AssistantModelGenerationResponse} mock_model_response
 * @property {GenerationEvalSemanticExpectations} expectations
 */

/**
 * @typedef {object} ScorerResult
 * @property {boolean} pass
 * @property {string[]} failure_modes
 * @property {Record<string, unknown>} diagnostics
 */

/**
 * @param {EvidencePacket} packet
 * @returns {Map<string, string>}
 */
function evidenceTextById(packet) {
  return new Map(
    packet.entries.map((entry) => [entry.evidence_id, entry.retrieval_text]),
  );
}

/**
 * @param {string} haystack
 * @param {string} needle
 */
function containsSubstring(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @param {CitationSupportClaimExpectation[]} rules
 * @returns {ScorerResult}
 */
export function scoreCitationSupport(model, packet, rules = []) {
  /** @type {string[]} */
  const failureModes = [];
  const byEvidence = evidenceTextById(packet);

  for (const rule of rules) {
    const claim = model.claims[rule.claim_index];
    const path = `claims[${rule.claim_index}]`;
    if (!claim) {
      failureModes.push("citation_support_missing_claim");
      continue;
    }

    const citations = claim.citations ?? [];
    if (citations.length === 0) {
      failureModes.push(`citation_support_no_citations:${path}`);
      continue;
    }

    const citedTexts = citations
      .map((citation) => byEvidence.get(citation.evidence_id))
      .filter((text) => typeof text === "string");

    if (citedTexts.length === 0) {
      failureModes.push(`citation_support_unknown_evidence:${path}`);
      continue;
    }

    const blob = citedTexts.join("\n");
    for (const substring of rule.required_evidence_substrings ?? []) {
      if (!containsSubstring(blob, substring)) {
        failureModes.push(
          `citation_support_missing_substring:${path}:${substring}`,
        );
      }
    }
  }

  return {
    pass: failureModes.length === 0,
    failure_modes: failureModes,
    diagnostics: { scorer: "citation_support", rules_count: rules.length },
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {AttributionClaimExpectation[]} rules
 * @returns {ScorerResult}
 */
export function scoreAttributionAccuracy(model, rules = []) {
  /** @type {string[]} */
  const failureModes = [];

  for (const rule of rules) {
    const claim = model.claims[rule.claim_index];
    const path = `claims[${rule.claim_index}]`;
    if (!claim) {
      failureModes.push("attribution_missing_claim");
      continue;
    }

    if (
      rule.expected_attribution &&
      claim.attribution !== rule.expected_attribution
    ) {
      failureModes.push(
        `attribution_expected_mismatch:${path}:${claim.attribution}`,
      );
    }

    if (rule.forbidden_attributions?.includes(claim.attribution)) {
      failureModes.push(`attribution_forbidden:${path}:${claim.attribution}`);
    }

    const markers = rule.personal_markers ?? [];
    for (const marker of markers) {
      if (
        containsSubstring(claim.text, marker) &&
        claim.attribution === "general_knowledge"
      ) {
        failureModes.push(
          `attribution_personal_as_general_knowledge:${path}:${marker}`,
        );
      }
    }
  }

  return {
    pass: failureModes.length === 0,
    failure_modes: failureModes,
    diagnostics: { scorer: "attribution_accuracy", rules_count: rules.length },
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {AbstentionExpectation} [expectation]
 * @returns {ScorerResult}
 */
export function scoreAbstention(model, expectation) {
  /** @type {string[]} */
  const failureModes = [];

  if (!expectation) {
    return {
      pass: true,
      failure_modes: [],
      diagnostics: { scorer: "abstention", skipped: true },
    };
  }

  if (model.abstained !== expectation.abstained) {
    failureModes.push(
      `abstention_flag_mismatch:expected=${expectation.abstained}:actual=${model.abstained}`,
    );
  }

  if (expectation.abstained) {
    if (!model.abstention_reason) {
      failureModes.push("abstention_missing_reason");
    } else if (
      expectation.abstention_reason &&
      model.abstention_reason !== expectation.abstention_reason
    ) {
      failureModes.push(
        `abstention_reason_mismatch:expected=${expectation.abstention_reason}:actual=${model.abstention_reason}`,
      );
    }
  } else if (model.abstention_reason) {
    failureModes.push("abstention_reason_present_when_not_abstained");
  }

  return {
    pass: failureModes.length === 0,
    failure_modes: failureModes,
    diagnostics: { scorer: "abstention", expectation },
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {string[]} forbiddenSubstrings
 */
export function scoreForbiddenAnswerContent(model, forbiddenSubstrings = []) {
  /** @type {string[]} */
  const failureModes = [];
  const answerBlob = model.claims.map((claim) => claim.text).join("\n");

  for (const substring of forbiddenSubstrings) {
    if (containsSubstring(answerBlob, substring)) {
      failureModes.push(`forbidden_answer_substring:${substring}`);
    }
  }

  return {
    pass: failureModes.length === 0,
    failure_modes: failureModes,
    diagnostics: {
      scorer: "forbidden_answer_content",
      forbidden_count: forbiddenSubstrings.length,
    },
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @param {GenerationEvalSemanticExpectations} expectations
 */
export function scoreGenerationSemantics(model, packet, expectations) {
  const citationSupport = scoreCitationSupport(
    model,
    packet,
    expectations.citation_support ?? [],
  );
  const attribution = scoreAttributionAccuracy(
    model,
    expectations.attribution_accuracy ?? [],
  );
  const abstention = scoreAbstention(model, expectations.abstention);
  const forbidden = scoreForbiddenAnswerContent(
    model,
    expectations.forbidden_answer_substrings ?? [],
  );

  const failureModes = [
    ...citationSupport.failure_modes,
    ...attribution.failure_modes,
    ...abstention.failure_modes,
    ...forbidden.failure_modes,
  ];

  return {
    pass: failureModes.length === 0,
    failure_modes: failureModes,
    diagnostics: {
      citation_support: citationSupport,
      attribution_accuracy: attribution,
      abstention,
      forbidden_answer_content: forbidden,
    },
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @param {GenerationEvalSemanticExpectations} [expectations]
 */
export function evaluateGenerationResponse(model, packet, expectations = {}) {
  const parsed = parseAssistantModelGenerationResponse(model);
  if (!parsed.ok) {
    return {
      pass: false,
      status: "fail",
      failure_modes: ["structural_parse_failed", ...parsed.errors],
      diagnostics: {
        case: "evaluateGenerationResponse",
        parse_errors: parsed.errors,
      },
    };
  }

  const integrity = validateGenerationResponse(model, packet);
  const semantics = scoreGenerationSemantics(model, packet, expectations);

  const failureModes = [
    ...(integrity.valid ? [] : integrity.errors.map((e) => `integrity:${e}`)),
    ...semantics.failure_modes,
  ];

  return {
    pass: failureModes.length === 0,
    status: failureModes.length === 0 ? "pass" : "fail",
    failure_modes: failureModes,
    diagnostics: {
      integrity_valid: integrity.valid,
      integrity_errors: integrity.errors,
      semantics: semantics.diagnostics,
      packet: {
        assembly_mode: packet.assembly_mode,
        entry_count: packet.entries.length,
        character_count: packet.character_count,
      },
    },
  };
}

/**
 * @param {Record<GenerationEvalAssemblyMode, EvidencePacket>} packetsByMode
 */
export function compareAssemblyModePackets(packetsByMode) {
  /** @type {Record<string, { entry_count: number, character_count: number, assembly_mode: string }>} */
  const summary = {};

  for (const mode of GENERATION_EVAL_ASSEMBLY_MODES) {
    const packet = packetsByMode[mode];
    if (!packet) {
      summary[mode] = {
        entry_count: -1,
        character_count: -1,
        assembly_mode: "missing",
      };
      continue;
    }
    summary[mode] = {
      entry_count: packet.entries.length,
      character_count: packet.character_count,
      assembly_mode: packet.assembly_mode,
    };
  }

  const fullParentEntries = summary.full_parent?.entry_count ?? 0;
  const topKEntries = summary.top_k_only?.entry_count ?? 0;
  const noRetrievalEntries = summary.no_retrieval?.entry_count ?? 0;

  return {
    summary,
    retrieval_contribution: {
      full_parent_expands_vs_top_k: fullParentEntries >= topKEntries,
      top_k_has_evidence_when_no_retrieval_empty:
        topKEntries > noRetrievalEntries,
    },
  };
}

/**
 * @param {GenerationEvalCase} case_
 * @param {EvidencePacket} packet
 */
export function evaluateGenerationCase(case_, packet) {
  const outcome = evaluateGenerationResponse(
    case_.mock_model_response,
    packet,
    case_.expectations,
  );

  return {
    ...outcome,
    diagnostics: {
      ...outcome.diagnostics,
      case_id: case_.id,
      category: case_.category,
      question: case_.question,
    },
  };
}

/**
 * @param {{
 *   pass?: boolean,
 *   failure_modes?: string[],
 *   diagnostics?: Record<string, unknown>,
 * } | null | undefined} outcome
 */
export function formatGenerationEvalFailureMessage(outcome) {
  const failureModes = Array.isArray(outcome?.failure_modes)
    ? outcome.failure_modes
    : [];
  const label =
    failureModes.length > 0 ? failureModes.join(", ") : "(none reported)";
  const diagnostics = outcome?.diagnostics ?? {};
  return `failure_modes=${label}\n${JSON.stringify(diagnostics, null, 2)}`;
}

async function runEvalCli() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );
  const fixtureRoot = path.join(
    repoRoot,
    "tests/fixtures/assistant-generation",
  );
  const fixture = JSON.parse(
    fs.readFileSync(path.join(fixtureRoot, "eval-cases.json"), "utf8"),
  );

  /**
   * @param {string} fileName
   */
  function loadPacket(fileName) {
    return JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, "packets", fileName), "utf8"),
    );
  }

  /** @type {Array<Record<string, unknown>>} */
  const results = [];

  for (const case_ of fixture.cases) {
    if (case_.eval_mode === "negative") {
      continue;
    }
    const packet = loadPacket(case_.packet_fixture);
    const outcome = evaluateGenerationCase(case_, packet);
    results.push({
      id: case_.id,
      pass: outcome.pass,
      failure_modes: outcome.failure_modes,
    });
  }

  if (fixture.assembly_comparison?.packet_fixtures) {
    /** @type {Record<GenerationEvalAssemblyMode, EvidencePacket>} */
    const packetsByMode = {};
    for (const mode of GENERATION_EVAL_ASSEMBLY_MODES) {
      const file = fixture.assembly_comparison.packet_fixtures[mode];
      packetsByMode[mode] = loadPacket(file);
    }
    results.push({
      id: fixture.assembly_comparison.id,
      assembly_comparison: compareAssemblyModePackets(packetsByMode),
    });
  }

  const failed = results.filter((row) => row.pass === false);
  console.log(
    JSON.stringify({ results, failed_count: failed.length }, null, 2),
  );
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  runEvalCli().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

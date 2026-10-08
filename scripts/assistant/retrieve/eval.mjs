/**
 * Structure-aware retrieval eval helpers (fixture-driven; no LLM).
 */

/**
 * @typedef {"positive" | "negative_inspection" | "corpus_gap"} EvalCaseKind
 */

/**
 * @typedef {object} EvalCase
 * @property {string} id
 * @property {string} question
 * @property {EvalCaseKind} kind
 * @property {number} top_k
 * @property {string[]} [expected_parent_concepts]
 * @property {string[]} [expected_unit_any_of]
 * @property {string[]} [expected_sections]
 * @property {number} [min_parent_rank]
 * @property {number} [min_unit_rank]
 * @property {boolean} [require_specificity]
 */

/**
 * @typedef {object} EvalHit
 * @property {number} rank
 * @property {number} cosine_distance
 * @property {number} similarity
 * @property {string} unit_id
 * @property {string} okf_concept_id
 * @property {string} source_class
 * @property {string} type
 * @property {string} title
 * @property {string} resource
 * @property {string} retrieval_text
 * @property {unknown} sources
 * @property {unknown} metadata
 * @property {string | null} [section_heading]
 */

/**
 * @param {unknown} metadata
 * @returns {string | null}
 */
export function sectionHeadingFromMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const heading = /** @type {Record<string, unknown>} */ (metadata)
    .section_heading;
  return typeof heading === "string" && heading.length > 0 ? heading : null;
}

/**
 * Prefix glob: pattern ending with `*` matches unit_id prefix; otherwise exact.
 *
 * @param {string} unitId
 * @param {string} pattern
 */
export function matchesUnitPattern(unitId, pattern) {
  if (pattern.endsWith("*")) {
    return unitId.startsWith(pattern.slice(0, -1));
  }
  return unitId === pattern;
}

/**
 * @param {EvalHit} hit
 * @param {string[]} patterns
 */
export function hitMatchesUnitPatterns(hit, patterns) {
  return patterns.some((pattern) => matchesUnitPattern(hit.unit_id, pattern));
}

/**
 * Section substring match for eval — textual relevance, not strict chunk boundaries.
 *
 * Matches against `section_heading` (metadata), `title`, and the first 400 chars of
 * `retrieval_text`. A pass does not prove the hit aligns with structure-aware
 * `section_heading` / part_key; a stricter follow-on eval can require heading-only.
 *
 * @param {EvalHit} hit
 * @param {string[]} sectionSubstrings
 */
export function hitMatchesSections(hit, sectionSubstrings) {
  const heading =
    hit.section_heading ?? sectionHeadingFromMetadata(hit.metadata);
  const haystack = [heading, hit.title, hit.retrieval_text?.slice(0, 400) ?? ""]
    .filter(Boolean)
    .join("\n");
  return sectionSubstrings.some((needle) => haystack.includes(needle));
}

/**
 * @param {EvalHit[]} hits
 * @param {string[]} expectedParents
 * @returns {{ rank: number, hit: EvalHit } | null}
 */
export function firstParentMatch(hits, expectedParents) {
  const expected = new Set(expectedParents);
  for (const hit of hits) {
    if (expected.has(hit.okf_concept_id)) {
      return { rank: hit.rank, hit };
    }
  }
  return null;
}

/**
 * @param {EvalHit[]} hits
 * @param {string[]} patterns
 * @returns {{ rank: number, hit: EvalHit } | null}
 */
export function firstUnitPatternMatch(hits, patterns) {
  for (const hit of hits) {
    if (hitMatchesUnitPatterns(hit, patterns)) {
      return { rank: hit.rank, hit };
    }
  }
  return null;
}

/**
 * @param {boolean | null} pass `null` for diagnostic-only cases (not scored pass/fail).
 * @param {string[]} failureModes
 * @param {Record<string, unknown>} diagnostics
 */
export function finalizeEvalOutcome(pass, failureModes, diagnostics) {
  const modes = Array.isArray(failureModes) ? [...failureModes] : [];
  const blockingFailureModes = modes.filter(
    (mode) => !mode.startsWith("optional_"),
  );
  diagnostics.failure_modes = modes;
  diagnostics.blocking_failure_modes = blockingFailureModes;
  /** @type {"pass" | "fail" | "diagnostic"} */
  const status = pass === null ? "diagnostic" : pass ? "pass" : "fail";
  return { pass, failureModes: modes, diagnostics, status };
}

/**
 * @param {EvalCase} case_
 * @param {EvalHit[]} hits
 */
export function evaluateRetrievalCase(case_, hits) {
  const topHits = hits.slice(0, case_.top_k).map((hit) => ({
    ...hit,
    section_heading:
      hit.section_heading ?? sectionHeadingFromMetadata(hit.metadata),
  }));

  /** @type {string[]} */
  const failureModes = [];
  /** @type {Record<string, unknown>} */
  const diagnostics = {
    case_id: case_.id,
    kind: case_.kind,
    question: case_.question,
    top_k: case_.top_k,
    failure_modes: [],
    blocking_failure_modes: [],
    hits: topHits.map((hit) => ({
      rank: hit.rank,
      unit_id: hit.unit_id,
      okf_concept_id: hit.okf_concept_id,
      title: hit.title,
      section_heading: hit.section_heading,
      cosine_distance: hit.cosine_distance,
      similarity: hit.similarity,
    })),
  };

  if (case_.kind === "corpus_gap") {
    const memorySignals = topHits.filter((hit) => {
      const blob = `${hit.title}\n${hit.retrieval_text}`.toLowerCase();
      return (
        blob.includes("agent memory") ||
        blob.includes("savepoint") ||
        hit.okf_concept_id.includes("savepoint")
      );
    });
    diagnostics.eval_mode = "diagnostic";
    diagnostics.corpus_gap = {
      note: "Diagnostic only — records whether top-K contains dedicated agent-memory evidence. Does not assert retrieval abstention (that belongs to grounded generation / thresholding later).",
      memory_related_hits: memorySignals.map((hit) => hit.unit_id),
    };
    return finalizeEvalOutcome(null, failureModes, diagnostics);
  }

  if (case_.kind === "negative_inspection") {
    diagnostics.eval_mode = "diagnostic";
    diagnostics.negative_inspection = {
      note: "Diagnostic only — capture distances and titles for manual review. Vector search always returns top-K; this is not a negative-query pass/fail and does not assert unit absence.",
      best_distance: topHits[0]?.cosine_distance ?? null,
      best_similarity: topHits[0]?.similarity ?? null,
    };
    return finalizeEvalOutcome(null, failureModes, diagnostics);
  }

  const expectedParents = case_.expected_parent_concepts ?? [];
  if (expectedParents.length === 0) {
    failureModes.push("invalid_fixture");
    return finalizeEvalOutcome(false, failureModes, {
      ...diagnostics,
      error: "positive case requires expected_parent_concepts",
    });
  }

  const parentMatch = firstParentMatch(topHits, expectedParents);
  if (!parentMatch) {
    failureModes.push("missing_parent_context");
    return finalizeEvalOutcome(false, failureModes, diagnostics);
  }

  diagnostics.parent_match = {
    rank: parentMatch.rank,
    okf_concept_id: parentMatch.hit.okf_concept_id,
    unit_id: parentMatch.hit.unit_id,
  };

  if (
    case_.min_parent_rank !== undefined &&
    parentMatch.rank > case_.min_parent_rank
  ) {
    failureModes.push("parent_rank_too_low");
  }

  const enforceSpecificity = case_.require_specificity === true;

  if (case_.expected_unit_any_of?.length) {
    const unitMatch = firstUnitPatternMatch(
      topHits,
      case_.expected_unit_any_of,
    );
    if (unitMatch) {
      diagnostics.unit_match = {
        rank: unitMatch.rank,
        unit_id: unitMatch.hit.unit_id,
        optional: !enforceSpecificity,
      };
      if (
        enforceSpecificity &&
        case_.min_unit_rank !== undefined &&
        unitMatch.rank > case_.min_unit_rank
      ) {
        failureModes.push("unit_rank_too_low");
      }
    } else if (enforceSpecificity) {
      failureModes.push("wrong_chunk_or_over_split");
    } else {
      diagnostics.optional_unit_miss = {
        patterns: case_.expected_unit_any_of,
        note: "Optional chunk expectation missed — parent hit may still be acceptable; tune chunk boundaries or top_k.",
      };
      failureModes.push("optional_unit_miss");
    }
  }

  if (case_.expected_sections?.length) {
    const sectionHit = topHits.find((hit) =>
      hitMatchesSections(hit, case_.expected_sections ?? []),
    );
    if (sectionHit) {
      diagnostics.section_match = {
        rank: sectionHit.rank,
        unit_id: sectionHit.unit_id,
        section_heading: sectionHit.section_heading,
        optional: !enforceSpecificity,
      };
    } else if (enforceSpecificity) {
      failureModes.push("wrong_section");
    } else {
      diagnostics.optional_section_miss = {
        sections: case_.expected_sections,
        note: "Optional section expectation missed — recorded for chunk-boundary tuning.",
      };
      failureModes.push("optional_section_miss");
    }
  }

  const pass =
    failureModes.filter((mode) => !mode.startsWith("optional_")).length === 0;
  return finalizeEvalOutcome(pass, failureModes, diagnostics);
}

/**
 * @param {{ diagnostics?: Record<string, unknown> } | null | undefined} result
 */
export function formatEvalDiagnostics(result) {
  const diagnostics = result?.diagnostics;
  if (!diagnostics || typeof diagnostics !== "object") {
    return JSON.stringify({ error: "missing diagnostics" }, null, 2);
  }
  return JSON.stringify(diagnostics, null, 2);
}

/**
 * Safe assertion message for integration failures — never throws when diagnostics are incomplete.
 *
 * @param {{
 *   pass?: boolean | null,
 *   failureModes?: string[],
 *   diagnostics?: Record<string, unknown>,
 * } | null | undefined} outcome
 */
export function formatEvalFailureMessage(outcome) {
  const failureModes = Array.isArray(outcome?.failureModes)
    ? outcome.failureModes
    : [];
  const diagnostics = outcome?.diagnostics;
  const blockingFromDiagnostics = diagnostics?.blocking_failure_modes;
  const blocking = Array.isArray(blockingFromDiagnostics)
    ? blockingFromDiagnostics.map(String)
    : failureModes.filter((mode) => !mode.startsWith("optional_"));
  const blockingLabel =
    blocking.length > 0 ? blocking.join(",") : "(none reported)";
  return `blocking_failure_modes=${blockingLabel}\n${formatEvalDiagnostics(outcome ?? {})}`;
}

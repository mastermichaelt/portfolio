import { EvidenceBudgetExceeded } from "./errors.mjs";

/** @typedef {'full_parent' | 'top_k_only'} AssemblyMode */

/**
 * @typedef {object} MatchedRetrievalHit
 * @property {number} rank
 * @property {number} [cosine_distance]
 * @property {number} [similarity]
 * @property {string} unit_id
 * @property {string} okf_concept_id
 * @property {string} [source_class]
 * @property {string} [type]
 * @property {string} [title]
 * @property {string} [resource]
 * @property {string} retrieval_text
 * @property {string} [content_hash]
 * @property {unknown} [sources]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {object} EvidencePacketEntry
 * @property {string} evidence_id Stable citation key (`E1`, `E2`, …)
 * @property {string} unit_id
 * @property {string} okf_concept_id
 * @property {string} content_hash
 * @property {string} retrieval_text
 * @property {string} [resource]
 * @property {string} [title]
 * @property {unknown} [sources] OKF provenance chain for URL integrity checks
 * @property {boolean} matched_retrieval Included because it appeared in top-K hits
 * @property {number} [retrieval_rank] Best rank when matched
 */

/**
 * @typedef {object} EvidencePacket
 * @property {AssemblyMode} assembly_mode
 * @property {MatchedRetrievalHit[]} matched_hits
 * @property {EvidencePacketEntry[]} entries
 * @property {number} character_budget
 * @property {number} character_count
 * @property {boolean} truncated Unmatched parent chunks omitted due to budget
 */

export const ASSEMBLY_MODES = /** @type {const} */ ([
  "full_parent",
  "top_k_only",
]);

/** Conservative default for dev tooling; override per call. */
export const DEFAULT_EVIDENCE_CHARACTER_BUDGET = 120_000;

/**
 * @param {string} text
 * @returns {number}
 */
export function characterCostForRetrievalText(text) {
  return text.length;
}

/**
 * @param {EvidencePacketEntry[]} entries
 * @returns {number}
 */
export function totalCharacterCost(entries) {
  return entries.reduce(
    (sum, entry) => sum + characterCostForRetrievalText(entry.retrieval_text),
    0,
  );
}

/**
 * @param {MatchedRetrievalHit[]} hits
 * @returns {Map<string, number>}
 */
function bestRankByUnitId(hits) {
  /** @type {Map<string, number>} */
  const ranks = new Map();
  for (const hit of hits) {
    const existing = ranks.get(hit.unit_id);
    if (existing === undefined || hit.rank < existing) {
      ranks.set(hit.unit_id, hit.rank);
    }
  }
  return ranks;
}

/**
 * @param {MatchedRetrievalHit[]} hits
 * @returns {string[]}
 */
function distinctParentsByBestRank(hits) {
  /** @type {Map<string, number>} */
  const bestRank = new Map();
  for (const hit of hits) {
    const rank = bestRank.get(hit.okf_concept_id);
    if (rank === undefined || hit.rank < rank) {
      bestRank.set(hit.okf_concept_id, hit.rank);
    }
  }
  return [...bestRank.entries()]
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([conceptId]) => conceptId);
}

/**
 * @typedef {import("./fetch-parent-units.mjs").ParentRetrievalUnitRow} ParentRetrievalUnitRow
 */

/**
 * @param {ParentRetrievalUnitRow | MatchedRetrievalHit} row
 * @param {Map<string, number>} rankByUnitId
 * @returns {{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }}
 */
function toCandidateUnit(row, rankByUnitId) {
  const unit_id = row.unit_id;
  const retrieval_rank = rankByUnitId.get(unit_id);
  const matched = retrieval_rank !== undefined;
  const content_hash =
    row.content_hash ??
    (typeof row.retrieval_text === "string" ? row.retrieval_text : "");

  return {
    unit: {
      unit_id,
      okf_concept_id: row.okf_concept_id,
      source_class: row.source_class ?? "",
      type: row.type ?? "",
      title: row.title ?? "",
      resource: row.resource ?? "",
      retrieval_text: row.retrieval_text,
      content_hash: String(content_hash),
      sources: row.sources,
      metadata: row.metadata ?? {},
      chunk_index:
        row.chunk_index ??
        (typeof row.metadata?.chunk_index === "number"
          ? row.metadata.chunk_index
          : null),
    },
    matched,
    retrieval_rank,
  };
}

/**
 * Deduplicate within one OKF concept. Matched units are never collapsed with
 * each other; unmatched duplicates share one hash; a matched unit supersedes an
 * earlier unmatched row with the same hash.
 *
 * @param {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>} candidates
 * @returns {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>}
 */
export function dedupeCandidatesWithinConcept(candidates) {
  /** @type {Set<string>} */
  const matchedUnitIds = new Set();
  /** @type {Set<string>} */
  const seenContentHashes = new Set();
  /** @type {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>} */
  const deduped = [];

  for (const candidate of candidates) {
    const contentHash = candidate.unit.content_hash;

    if (candidate.matched) {
      if (matchedUnitIds.has(candidate.unit.unit_id)) {
        continue;
      }

      for (let index = deduped.length - 1; index >= 0; index -= 1) {
        const existing = deduped[index];
        if (!existing.matched && existing.unit.content_hash === contentHash) {
          deduped.splice(index, 1);
        }
      }

      matchedUnitIds.add(candidate.unit.unit_id);
      seenContentHashes.add(contentHash);
      deduped.push(candidate);
      continue;
    }

    if (seenContentHashes.has(contentHash)) {
      continue;
    }
    seenContentHashes.add(contentHash);
    deduped.push(candidate);
  }

  return deduped;
}

/**
 * @param {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>} candidates
 * @param {number} characterBudget
 * @returns {{ included: typeof candidates, truncated: boolean }}
 */
function applyEvidenceBudget(candidates, characterBudget) {
  const matched = candidates.filter((c) => c.matched);
  const unmatched = candidates.filter((c) => !c.matched);

  const matchedCost = matched.reduce(
    (sum, candidate) =>
      sum + characterCostForRetrievalText(candidate.unit.retrieval_text),
    0,
  );

  if (matchedCost > characterBudget) {
    throw new EvidenceBudgetExceeded(
      "Matched retrieval units exceed the evidence character budget",
      {
        character_budget: characterBudget,
        matched_character_cost: matchedCost,
        matched_unit_count: matched.length,
      },
    );
  }

  /** @type {typeof candidates} */
  const included = [...matched];
  let remaining = characterBudget - matchedCost;
  let truncated = false;

  for (const candidate of unmatched) {
    const cost = characterCostForRetrievalText(candidate.unit.retrieval_text);
    if (cost <= remaining) {
      included.push(candidate);
      remaining -= cost;
    } else {
      truncated = true;
    }
  }

  const includedUnitIds = new Set(included.map((c) => c.unit.unit_id));
  if (unmatched.some((c) => !includedUnitIds.has(c.unit.unit_id))) {
    truncated = true;
  }

  return { included, truncated };
}

/**
 * @param {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>} included
 * @returns {EvidencePacketEntry[]}
 */
function assignEvidenceIds(included) {
  return included.map((candidate, index) => ({
    evidence_id: `E${index + 1}`,
    unit_id: candidate.unit.unit_id,
    okf_concept_id: candidate.unit.okf_concept_id,
    content_hash: candidate.unit.content_hash,
    retrieval_text: candidate.unit.retrieval_text,
    resource: candidate.unit.resource,
    title: candidate.unit.title,
    sources: candidate.unit.sources,
    matched_retrieval: candidate.matched,
    retrieval_rank: candidate.retrieval_rank,
  }));
}

/**
 * @typedef {object} AssembleEvidencePacketOptions
 * @property {MatchedRetrievalHit[]} matchedHits Top-K retrieval rows (required)
 * @property {AssemblyMode} [assemblyMode]
 * @property {number} [characterBudget]
 * @property {(okfConceptId: string) => Promise<ParentRetrievalUnitRow[]>} [fetchParentUnits]
 *   Required when `assemblyMode` is `full_parent`.
 */

/**
 * @param {AssembleEvidencePacketOptions} options
 * @returns {Promise<EvidencePacket>}
 */
export async function assembleEvidencePacket(options) {
  const {
    matchedHits,
    assemblyMode = "full_parent",
    characterBudget = DEFAULT_EVIDENCE_CHARACTER_BUDGET,
    fetchParentUnits,
  } = options;

  if (!Array.isArray(matchedHits) || matchedHits.length === 0) {
    throw new Error("matchedHits must be a non-empty array");
  }
  if (!Number.isFinite(characterBudget) || characterBudget < 1) {
    throw new Error(
      `characterBudget must be a positive number, received ${characterBudget}`,
    );
  }
  if (!ASSEMBLY_MODES.includes(assemblyMode)) {
    throw new Error(`Unknown assembly mode: ${assemblyMode}`);
  }

  const rankByUnitId = bestRankByUnitId(matchedHits);

  /** @type {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>} */
  let candidates;

  if (assemblyMode === "top_k_only") {
    candidates = matchedHits.map((hit) => toCandidateUnit(hit, rankByUnitId));
  } else {
    if (typeof fetchParentUnits !== "function") {
      throw new Error(
        "fetchParentUnits is required when assemblyMode is full_parent",
      );
    }

    const parentIds = distinctParentsByBestRank(matchedHits);
    /** @type {Array<{ unit: ParentRetrievalUnitRow, matched: boolean, retrieval_rank?: number }>} */
    const expanded = [];

    for (const parentId of parentIds) {
      const parentUnits = await fetchParentUnits(parentId);
      const parentCandidates = parentUnits.map((unit) =>
        toCandidateUnit(unit, rankByUnitId),
      );
      expanded.push(...dedupeCandidatesWithinConcept(parentCandidates));
    }

    candidates = expanded;
  }

  const { included, truncated } = applyEvidenceBudget(
    candidates,
    characterBudget,
  );

  const includedMatchedIds = new Set(
    included.filter((c) => c.matched).map((c) => c.unit.unit_id),
  );
  for (const unitId of rankByUnitId.keys()) {
    if (!includedMatchedIds.has(unitId)) {
      throw new Error(
        `Matched retrieval unit missing from assembled evidence: ${unitId}`,
      );
    }
  }

  const entries = assignEvidenceIds(included);

  return {
    assembly_mode: assemblyMode,
    matched_hits: matchedHits,
    entries,
    character_budget: characterBudget,
    character_count: totalCharacterCost(entries),
    truncated,
  };
}

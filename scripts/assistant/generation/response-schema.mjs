export const SUPPORT_LEVELS = /** @type {const} */ ([
  "full",
  "partial",
  "none",
]);

export const CLAIM_ATTRIBUTIONS = /** @type {const} */ ([
  "evidence_supported",
  "evidence_inferred",
  "general_knowledge",
  "uncertain",
]);

export const ABSTENTION_REASONS = /** @type {const} */ ([
  "no_retrieval_hits",
  "irrelevant_evidence",
  "unsupported_personal_claim",
  "conflicting_evidence",
  "policy_refusal",
  "other",
]);

/**
 * @typedef {'full' | 'partial' | 'none'} SupportLevel
 * @typedef {'evidence_supported' | 'evidence_inferred' | 'general_knowledge' | 'uncertain'} ClaimAttribution
 * @typedef {'no_retrieval_hits' | 'irrelevant_evidence' | 'unsupported_personal_claim' | 'conflicting_evidence' | 'policy_refusal' | 'other'} AbstentionReason
 */

/**
 * @typedef {object} AssistantCitation
 * @property {string} evidence_id
 * @property {string} unit_id
 */

/**
 * @typedef {object} AssistantClaim
 * @property {string} text
 * @property {ClaimAttribution} attribution
 * @property {AssistantCitation[]} [citations]
 */

/**
 * Canonical structured JSON from the LLM (before service derivation).
 *
 * @typedef {object} AssistantModelGenerationResponse
 * @property {AssistantClaim[]} claims
 * @property {SupportLevel} support_level
 * @property {boolean} abstained
 * @property {AbstentionReason} [abstention_reason]
 */

/**
 * Public generation response (model fields + service-derived prose and citations).
 *
 * @typedef {object} AssistantGenerationDiagnostics
 * @property {string} [assembly_mode]
 * @property {boolean} [truncated]
 * @property {number} [retrieval_latency_ms]
 * @property {number} [assembly_latency_ms]
 * @property {number} [generation_latency_ms]
 * @property {string} [model]
 * @property {number} [prompt_tokens]
 * @property {number} [completion_tokens]
 * @property {number} [total_tokens]
 * @property {number} [evidence_entry_count]
 * @property {number} [evidence_character_count]
 * @property {number} [evidence_character_budget]
 * @property {Record<string, number>} [attribution_counts]
 * @property {string} [error_category]
 */

/**
 * @typedef {AssistantModelGenerationResponse & {
 *   answer_text: string,
 *   citations: AssistantCitation[],
 *   diagnostics?: AssistantGenerationDiagnostics,
 * }} AssistantGenerationResponse
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} citation
 * @param {string} path
 * @param {string[]} errors
 */
function validateCitationShape(citation, path, errors) {
  if (!isPlainObject(citation)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof citation.evidence_id !== "string" || !citation.evidence_id) {
    errors.push(`${path}.evidence_id must be a non-empty string`);
  }
  if (typeof citation.unit_id !== "string" || !citation.unit_id) {
    errors.push(`${path}.unit_id must be a non-empty string`);
  }
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: AssistantModelGenerationResponse } | { ok: false, errors: string[] }}
 */
export function parseAssistantModelGenerationResponse(raw) {
  /** @type {string[]} */
  const errors = [];

  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, errors: ["Response is not valid JSON"] };
    }
  }

  if (!isPlainObject(value)) {
    return { ok: false, errors: ["Response must be a JSON object"] };
  }

  const claims = value.claims;
  if (!Array.isArray(claims) || claims.length === 0) {
    errors.push("claims must be a non-empty array");
  } else {
    claims.forEach((claim, index) => {
      if (!isPlainObject(claim)) {
        errors.push(`claims[${index}] must be an object`);
        return;
      }
      if (typeof claim.text !== "string" || claim.text.trim() === "") {
        errors.push(`claims[${index}].text must be a non-empty string`);
      }
      const attribution = claim.attribution;
      if (
        typeof attribution !== "string" ||
        !CLAIM_ATTRIBUTIONS.includes(
          /** @type {ClaimAttribution} */ (attribution),
        )
      ) {
        errors.push(
          `claims[${index}].attribution must be one of: ${CLAIM_ATTRIBUTIONS.join(", ")}`,
        );
      }
      if (claim.citations !== undefined) {
        if (!Array.isArray(claim.citations)) {
          errors.push(
            `claims[${index}].citations must be an array when present`,
          );
        } else {
          claim.citations.forEach((citation, cIndex) => {
            validateCitationShape(
              citation,
              `claims[${index}].citations[${cIndex}]`,
              errors,
            );
          });
        }
      }
    });
  }

  const supportLevel = value.support_level;
  if (
    typeof supportLevel !== "string" ||
    !SUPPORT_LEVELS.includes(/** @type {SupportLevel} */ (supportLevel))
  ) {
    errors.push(`support_level must be one of: ${SUPPORT_LEVELS.join(", ")}`);
  }

  const abstained = value.abstained;
  if (typeof abstained !== "boolean") {
    errors.push("abstained must be a boolean");
  }

  const abstentionReason = value.abstention_reason;
  if (abstained === true) {
    if (
      typeof abstentionReason !== "string" ||
      !ABSTENTION_REASONS.includes(
        /** @type {AbstentionReason} */ (abstentionReason),
      )
    ) {
      errors.push(
        `abstention_reason is required when abstained is true and must be one of: ${ABSTENTION_REASONS.join(", ")}`,
      );
    }
  } else if (abstained === false && abstentionReason !== undefined) {
    errors.push("abstention_reason must be absent when abstained is false");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      claims: /** @type {AssistantClaim[]} */ (claims),
      support_level: /** @type {SupportLevel} */ (supportLevel),
      abstained: /** @type {boolean} */ (abstained),
      abstention_reason:
        abstained === true
          ? /** @type {AbstentionReason} */ (abstentionReason)
          : undefined,
    },
  };
}

/**
 * @param {AssistantClaim[]} claims
 * @returns {string}
 */
export function deriveAnswerTextFromClaims(claims) {
  return claims
    .map((claim) => claim.text.trim())
    .filter((text) => text.length > 0)
    .join("\n\n");
}

/**
 * @param {AssistantClaim[]} claims
 * @returns {AssistantCitation[]}
 */
export function deriveCitationsFromClaims(claims) {
  /** @type {AssistantCitation[]} */
  const merged = [];
  /** @type {Set<string>} */
  const seenEvidenceIds = new Set();

  for (const claim of claims) {
    const citations = claim.citations ?? [];
    for (const citation of citations) {
      if (seenEvidenceIds.has(citation.evidence_id)) {
        continue;
      }
      seenEvidenceIds.add(citation.evidence_id);
      merged.push({
        evidence_id: citation.evidence_id,
        unit_id: citation.unit_id,
      });
    }
  }

  return merged;
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @returns {AssistantGenerationResponse}
 */
export function buildPublicGenerationResponse(model) {
  const answerText = deriveAnswerTextFromClaims(model.claims);
  const citations = deriveCitationsFromClaims(model.claims);

  return {
    ...model,
    answer_text: answerText,
    citations,
  };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: AssistantGenerationResponse } | { ok: false, errors: string[] }}
 */
export function parseAssistantGenerationResponse(raw) {
  const modelParsed = parseAssistantModelGenerationResponse(raw);
  if (!modelParsed.ok) {
    return modelParsed;
  }

  const publicResponse = buildPublicGenerationResponse(modelParsed.value);
  if (publicResponse.answer_text.trim() === "") {
    return { ok: false, errors: ["derived answer_text must be non-empty"] };
  }

  return { ok: true, value: publicResponse };
}

/**
 * @param {unknown} raw
 * @returns {AssistantGenerationResponse}
 */
export function assertAssistantGenerationResponse(raw) {
  const parsed = parseAssistantGenerationResponse(raw);
  if (!parsed.ok) {
    throw new Error(parsed.errors.join("; "));
  }
  return parsed.value;
}

/**
 * @param {AssistantClaim[]} claims
 * @returns {Record<string, number>}
 */
export function countAttributions(claims) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const attribution of CLAIM_ATTRIBUTIONS) {
    counts[attribution] = 0;
  }
  for (const claim of claims) {
    counts[claim.attribution] = (counts[claim.attribution] ?? 0) + 1;
  }
  return counts;
}

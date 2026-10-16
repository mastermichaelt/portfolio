import { ABSTENTION_REASONS, CLAIM_ATTRIBUTIONS } from "./response-schema.mjs";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string} attribution
 * @returns {boolean}
 */
function isValidClaimAttribution(attribution) {
  return CLAIM_ATTRIBUTIONS.includes(
    /** @type {import("./response-schema.mjs").ClaimAttribution} */ (
      attribution
    ),
  );
}

/**
 * Model outputs sometimes put abstention vocabulary in `claims[].attribution`
 * (e.g. `"abstained"` or an `abstention_reason` value) while `abstained` is true.
 * Repair only that conflation — do not coerce unrelated malformed claims.
 *
 * @param {unknown} raw
 * @returns {unknown}
 */
export function repairAssistantModelGenerationJson(raw) {
  if (!isPlainObject(raw)) {
    return raw;
  }

  if (raw.abstained !== true) {
    return raw;
  }

  const claims = raw.claims;
  if (!Array.isArray(claims)) {
    return raw;
  }

  /** @type {unknown[]} */
  const repairedClaims = [];

  for (const claim of claims) {
    if (!isPlainObject(claim)) {
      repairedClaims.push(claim);
      continue;
    }

    const attribution = claim.attribution;
    if (
      typeof attribution === "string" &&
      isValidClaimAttribution(attribution)
    ) {
      repairedClaims.push(claim);
      continue;
    }

    if (typeof attribution !== "string") {
      repairedClaims.push(claim);
      continue;
    }

    const normalized = attribution.trim().toLowerCase();
    const isAbstentionVocabulary =
      normalized === "abstained" ||
      normalized === "abstention" ||
      ABSTENTION_REASONS.includes(
        /** @type {import("./response-schema.mjs").AbstentionReason} */ (
          normalized
        ),
      );

    if (!isAbstentionVocabulary) {
      repairedClaims.push(claim);
      continue;
    }

    repairedClaims.push({
      ...claim,
      attribution: "uncertain",
      citations: undefined,
    });
  }

  return {
    ...raw,
    claims: repairedClaims,
  };
}

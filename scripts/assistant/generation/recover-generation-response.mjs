import {
  collectApprovedEvidenceUrls,
  findUnapprovedUrlsInAnswer,
} from "./approved-urls.mjs";
import {
  ABSTENTION_REASONS,
  parseAssistantModelGenerationResponse,
} from "./response-schema.mjs";
import { validateGenerationResponse } from "./validate-response.mjs";
import {
  inferValidationStage,
  stableValidationIssueCodes,
  summarizeValidationIssues,
} from "./validation-issues.mjs";

/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */
/** @typedef {import("./response-schema.mjs").AssistantCitation} AssistantCitation */
/** @typedef {import("./response-schema.mjs").AssistantClaim} AssistantClaim */
/** @typedef {import("./response-schema.mjs").AssistantModelGenerationResponse} AssistantModelGenerationResponse */

/**
 * @typedef {object} RecoveryDiagnostics
 * @property {boolean} deterministic_repair_applied
 * @property {boolean} model_retry_attempted
 * @property {boolean} model_retry_succeeded
 * @property {boolean} graceful_degradation_applied
 * @property {string} [validation_stage]
 * @property {number} [validation_issue_count]
 * @property {string} [validation_issue_codes]
 * @property {number} [claims_removed_count]
 * @property {number} [citations_normalized_count]
 */

/**
 * @param {string} text
 * @returns {string}
 */
export function stripHttpUrlsFromClaimText(text) {
  return text
    .replace(/https?:\/\/[^\s)\]>]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * @param {AssistantCitation[]} citations
 * @param {EvidencePacket} packet
 * @returns {{ citations: AssistantCitation[], normalizedCount: number }}
 */
export function normalizeCitationsForPacket(citations, packet) {
  const registryByEvidenceId = new Map(
    packet.entries.map((entry) => [entry.evidence_id, entry]),
  );
  /** @type {AssistantCitation[]} */
  const normalized = [];
  /** @type {Set<string>} */
  const seen = new Set();
  let normalizedCount = 0;

  for (const citation of citations) {
    const entry = registryByEvidenceId.get(citation.evidence_id);
    if (!entry) {
      continue;
    }
    if (seen.has(citation.evidence_id)) {
      normalizedCount += 1;
      continue;
    }
    seen.add(citation.evidence_id);
    if (citation.unit_id !== entry.unit_id) {
      normalizedCount += 1;
    }
    normalized.push({
      evidence_id: citation.evidence_id,
      unit_id: entry.unit_id,
    });
  }

  return { citations: normalized, normalizedCount };
}

/**
 * @param {AssistantClaim} claim
 * @param {EvidencePacket} packet
 * @returns {AssistantClaim | null}
 */
function normalizeClaimForRecovery(claim, packet) {
  let text = claim.text?.trim() ?? "";
  if (!text) {
    return null;
  }

  let attribution = claim.attribution;
  let citations = claim.citations ?? [];

  if (attribution === "general_knowledge" || attribution === "uncertain") {
    text = stripHttpUrlsFromClaimText(text);
    if (!text) {
      return null;
    }
    return { text, attribution, citations: undefined };
  }

  if (
    attribution === "evidence_supported" ||
    attribution === "evidence_inferred"
  ) {
    const approvedUrls = collectApprovedEvidenceUrls(packet);
    const unapproved = findUnapprovedUrlsInAnswer(text, approvedUrls);
    if (unapproved.length > 0) {
      return null;
    }

    const normalized = normalizeCitationsForPacket(citations, packet);
    citations = normalized.citations;

    if (attribution === "evidence_supported" && citations.length === 0) {
      return null;
    }

    if (citations.length === 0) {
      return { text, attribution, citations: undefined };
    }

    return { text, attribution, citations };
  }

  return null;
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @returns {AssistantModelGenerationResponse}
 */
function cloneModel(model) {
  return structuredClone(model);
}

/**
 * @param {AssistantClaim[]} claims
 * @param {boolean} abstained
 * @returns {import("./response-schema.mjs").SupportLevel}
 */
export function inferSupportLevelFromClaims(claims, abstained) {
  if (abstained) {
    return "none";
  }
  const hasEvidenceBacked = claims.some(
    (claim) =>
      claim.attribution === "evidence_supported" ||
      claim.attribution === "evidence_inferred",
  );
  const hasGeneral = claims.some(
    (claim) =>
      claim.attribution === "general_knowledge" ||
      claim.attribution === "uncertain",
  );
  if (hasEvidenceBacked && hasGeneral) {
    return "partial";
  }
  if (hasEvidenceBacked) {
    return "full";
  }
  return "none";
}

/**
 * @param {import("./response-schema.mjs").AbstentionReason} [reason]
 * @returns {AssistantModelGenerationResponse}
 */
export function buildSafeAbstentionModel(reason = "irrelevant_evidence") {
  const abstentionReason = ABSTENTION_REASONS.includes(reason)
    ? reason
    : "other";

  return {
    claims: [
      {
        text: "I could not verify a grounded answer from the available evidence. Try rephrasing or ask about a specific project or published work.",
        attribution: "uncertain",
      },
    ],
    support_level: "none",
    abstained: true,
    abstention_reason: abstentionReason,
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @returns {{
 *   recovered: boolean,
 *   model?: AssistantModelGenerationResponse,
 *   citations_normalized_count?: number,
 *   claims_removed_count?: number,
 * }}
 */
export function tryDeterministicRecovery(model, packet) {
  const working = cloneModel(model);
  let citationsNormalizedCount = 0;
  let claimsRemovedCount = 0;

  /** @type {AssistantClaim[]} */
  const nextClaims = [];

  for (const claim of working.claims) {
    const beforeCitations = claim.citations?.length ?? 0;
    const normalized = normalizeClaimForRecovery(claim, packet);
    if (!normalized) {
      claimsRemovedCount += 1;
      continue;
    }
    const afterCitations = normalized.citations?.length ?? 0;
    if (beforeCitations > afterCitations) {
      citationsNormalizedCount += beforeCitations - afterCitations;
    }
    nextClaims.push(normalized);
  }

  working.claims = nextClaims;
  working.support_level = inferSupportLevelFromClaims(
    working.claims,
    working.abstained,
  );

  const validation = validateGenerationResponse(working, packet);
  if (validation.valid) {
    return {
      recovered: true,
      model: working,
      citations_normalized_count: citationsNormalizedCount,
      claims_removed_count: claimsRemovedCount,
    };
  }

  return {
    recovered: false,
    citations_normalized_count: citationsNormalizedCount,
    claims_removed_count: claimsRemovedCount,
  };
}

/**
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @returns {{ recovered: boolean, model?: AssistantModelGenerationResponse, claims_removed_count?: number }}
 */
export function tryGracefulDegradation(model, packet) {
  /** @type {AssistantClaim[]} */
  const kept = [];

  for (const claim of model.claims) {
    const candidate = normalizeClaimForRecovery(claim, packet);
    if (!candidate) {
      continue;
    }
    const singleModel = {
      ...model,
      claims: [candidate],
      abstained: false,
      abstention_reason: undefined,
    };
    singleModel.support_level = inferSupportLevelFromClaims(
      singleModel.claims,
      false,
    );
    if (validateGenerationResponse(singleModel, packet).valid) {
      kept.push(candidate);
    }
  }

  if (kept.length === 0) {
    const abstention = buildSafeAbstentionModel("irrelevant_evidence");
    if (validateGenerationResponse(abstention, packet).valid) {
      return {
        recovered: true,
        model: abstention,
        claims_removed_count: model.claims.length,
      };
    }
    return { recovered: false, claims_removed_count: model.claims.length };
  }

  const degraded = {
    ...model,
    claims: kept,
    abstained: false,
    abstention_reason: undefined,
    support_level: inferSupportLevelFromClaims(kept, false),
  };

  if (!validateGenerationResponse(degraded, packet).valid) {
    return { recovered: false, claims_removed_count: model.claims.length };
  }

  return {
    recovered: true,
    model: degraded,
    claims_removed_count: model.claims.length - kept.length,
  };
}

/**
 * @param {unknown} modelJson
 * @param {EvidencePacket} packet
 * @param {RecoveryDiagnostics} recovery
 * @returns {{
 *   ok: true,
 *   model: AssistantModelGenerationResponse,
 *   recovery: RecoveryDiagnostics,
 * } | {
 *   ok: false,
 *   stage: string,
 *   errors: string[],
 *   recovery: RecoveryDiagnostics,
 * }}
 */
export function resolveValidatedModelResponse(
  modelJson,
  packet,
  recovery = {},
) {
  /** @type {RecoveryDiagnostics} */
  const meta = {
    deterministic_repair_applied:
      recovery.deterministic_repair_applied ?? false,
    model_retry_attempted: recovery.model_retry_attempted ?? false,
    model_retry_succeeded: recovery.model_retry_succeeded ?? false,
    graceful_degradation_applied:
      recovery.graceful_degradation_applied ?? false,
  };

  const parsed = parseAssistantModelGenerationResponse(modelJson);
  if (!parsed.ok) {
    meta.validation_stage = "schema_parse";
    meta.validation_issue_count = parsed.errors.length;
    meta.validation_issue_codes = stableValidationIssueCodes(
      parsed.errors,
    ).join(",");
    return {
      ok: false,
      stage: "schema_parse",
      errors: parsed.errors,
      recovery: meta,
    };
  }

  let model = parsed.value;
  let validation = validateGenerationResponse(model, packet);
  if (validation.valid) {
    return { ok: true, model, recovery: meta };
  }

  meta.validation_stage = inferValidationStage(validation.errors);
  meta.validation_issue_count = validation.errors.length;
  meta.validation_issue_codes = stableValidationIssueCodes(
    validation.errors,
  ).join(",");

  const deterministic = tryDeterministicRecovery(model, packet);
  if (deterministic.recovered && deterministic.model) {
    meta.deterministic_repair_applied = true;
    meta.claims_removed_count = deterministic.claims_removed_count;
    meta.citations_normalized_count = deterministic.citations_normalized_count;
    return { ok: true, model: deterministic.model, recovery: meta };
  }

  const graceful = tryGracefulDegradation(model, packet);
  if (graceful.recovered && graceful.model) {
    meta.graceful_degradation_applied = true;
    meta.claims_removed_count = graceful.claims_removed_count;
    return { ok: true, model: graceful.model, recovery: meta };
  }

  return {
    ok: false,
    stage: meta.validation_stage ?? "evidence_integrity",
    errors: validation.errors,
    recovery: meta,
  };
}

/**
 * @param {RecoveryDiagnostics} recovery
 * @param {string[]} [errors]
 */
export function logGenerationRecoveryDiagnostics(recovery, errors = []) {
  const summary = summarizeValidationIssues(errors);
  console.warn(
    `[assistant-generation recovery] ${JSON.stringify({
      validation_stage: recovery.validation_stage,
      validation_issue_count: recovery.validation_issue_count,
      validation_issue_codes: recovery.validation_issue_codes,
      deterministic_repair_applied: recovery.deterministic_repair_applied,
      model_retry_attempted: recovery.model_retry_attempted,
      model_retry_succeeded: recovery.model_retry_succeeded,
      graceful_degradation_applied: recovery.graceful_degradation_applied,
      claims_removed_count: recovery.claims_removed_count,
      citations_normalized_count: recovery.citations_normalized_count,
      issue_summary: summary,
    })}`,
  );
}

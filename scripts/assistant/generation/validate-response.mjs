import {
  collectApprovedEvidenceUrls,
  findUnapprovedUrlsInAnswer,
} from "./approved-urls.mjs";
import {
  buildPublicGenerationResponse,
  parseAssistantGenerationResponse,
  parseAssistantModelGenerationResponse,
} from "./response-schema.mjs";

/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */
/** @typedef {import("./response-schema.mjs").AssistantCitation} AssistantCitation */
/** @typedef {import("./response-schema.mjs").AssistantGenerationResponse} AssistantGenerationResponse */
/** @typedef {import("./response-schema.mjs").AssistantModelGenerationResponse} AssistantModelGenerationResponse */

/**
 * @typedef {object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * @param {AssistantCitation[]} citations
 * @param {EvidencePacket} packet
 * @param {string} pathPrefix
 * @param {string[]} errors
 */
function validateCitationsAgainstPacket(citations, packet, pathPrefix, errors) {
  const registryByEvidenceId = new Map(
    packet.entries.map((entry) => [entry.evidence_id, entry]),
  );
  const registryUnitIds = new Set(packet.entries.map((entry) => entry.unit_id));
  const seenEvidenceIds = new Set();

  for (const [index, citation] of citations.entries()) {
    const path = `${pathPrefix}[${index}]`;
    if (seenEvidenceIds.has(citation.evidence_id)) {
      errors.push(`${path} duplicates evidence_id ${citation.evidence_id}`);
    }
    seenEvidenceIds.add(citation.evidence_id);

    const entry = registryByEvidenceId.get(citation.evidence_id);
    if (!entry) {
      errors.push(
        `${path} references unknown evidence_id ${citation.evidence_id}`,
      );
      continue;
    }

    if (entry.unit_id !== citation.unit_id) {
      errors.push(
        `${path} unit_id ${citation.unit_id} does not match evidence packet entry ${entry.unit_id} for ${citation.evidence_id}`,
      );
    }

    if (!registryUnitIds.has(citation.unit_id)) {
      errors.push(
        `${path} unit_id ${citation.unit_id} is not present in the evidence packet`,
      );
    }
  }
}

/**
 * Deterministic structural rules on the model JSON (before semantic eval).
 *
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @returns {ValidationResult}
 */
export function validateStructuralModelResponse(model, packet) {
  /** @type {string[]} */
  const errors = [];

  const parsed = parseAssistantModelGenerationResponse(model);
  if (!parsed.ok) {
    return { valid: false, errors: parsed.errors };
  }

  for (const [index, claim] of model.claims.entries()) {
    const citations = claim.citations ?? [];
    if (claim.attribution === "evidence_supported") {
      if (citations.length === 0) {
        errors.push(
          `claims[${index}] with evidence_supported requires non-empty citations`,
        );
      } else {
        validateCitationsAgainstPacket(
          citations,
          packet,
          `claims[${index}].citations`,
          errors,
        );
      }
    } else if (citations.length > 0) {
      validateCitationsAgainstPacket(
        citations,
        packet,
        `claims[${index}].citations`,
        errors,
      );
    }
  }

  const publicResponse = buildPublicGenerationResponse(model);
  if (publicResponse.answer_text.trim() === "") {
    errors.push("derived answer_text must be non-empty");
  }

  if (publicResponse.citations.length > 0) {
    validateCitationsAgainstPacket(
      publicResponse.citations,
      packet,
      "citations",
      errors,
    );
  }

  const approvedUrls = collectApprovedEvidenceUrls(packet);
  for (const [index, claim] of model.claims.entries()) {
    if (
      claim.attribution !== "evidence_supported" &&
      claim.attribution !== "evidence_inferred"
    ) {
      continue;
    }
    const unapprovedUrls = findUnapprovedUrlsInAnswer(claim.text, approvedUrls);
    for (const url of unapprovedUrls) {
      errors.push(
        `claims[${index}] references URL not in evidence packet: ${url}`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {unknown} response
 * @param {EvidencePacket} packet
 * @returns {ValidationResult}
 */
export function validateCitationIntegrity(response, packet) {
  const parsed = parseAssistantGenerationResponse(response);
  if (!parsed.ok) {
    return { valid: false, errors: parsed.errors };
  }

  return validateCitationIntegrityForParsedResponse(parsed.value, packet);
}

/**
 * @param {AssistantGenerationResponse} response
 * @param {EvidencePacket} packet
 * @returns {ValidationResult}
 */
export function validateCitationIntegrityForParsedResponse(response, packet) {
  const model = {
    claims: response.claims,
    support_level: response.support_level,
    abstained: response.abstained,
    abstention_reason: response.abstention_reason,
  };
  return validateStructuralModelResponse(model, packet);
}

/**
 * Full runtime validation: structural rules + citation integrity (same pass).
 *
 * @param {AssistantModelGenerationResponse} model
 * @param {EvidencePacket} packet
 * @returns {ValidationResult}
 */
export function validateGenerationResponse(model, packet) {
  return validateStructuralModelResponse(model, packet);
}

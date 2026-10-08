import {
  collectApprovedEvidenceUrls,
  findUnapprovedUrlsInAnswer,
} from "./approved-urls.mjs";
import { parseAssistantGenerationResponse } from "./response-schema.mjs";

/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */
/** @typedef {import("./response-schema.mjs").AssistantGenerationResponse} AssistantGenerationResponse */

/**
 * @typedef {object} CitationIntegrityResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * @param {unknown} response
 * @param {EvidencePacket} packet
 * @returns {CitationIntegrityResult}
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
 * @returns {CitationIntegrityResult}
 */
export function validateCitationIntegrityForParsedResponse(response, packet) {
  /** @type {string[]} */
  const errors = [];

  const registryByEvidenceId = new Map(
    packet.entries.map((entry) => [entry.evidence_id, entry]),
  );
  const registryUnitIds = new Set(packet.entries.map((entry) => entry.unit_id));

  const seenEvidenceIds = new Set();

  for (const [index, citation] of response.citations.entries()) {
    if (seenEvidenceIds.has(citation.evidence_id)) {
      errors.push(
        `citations[${index}] duplicates evidence_id ${citation.evidence_id}`,
      );
    }
    seenEvidenceIds.add(citation.evidence_id);

    const entry = registryByEvidenceId.get(citation.evidence_id);
    if (!entry) {
      errors.push(
        `citations[${index}] references unknown evidence_id ${citation.evidence_id}`,
      );
      continue;
    }

    if (entry.unit_id !== citation.unit_id) {
      errors.push(
        `citations[${index}] unit_id ${citation.unit_id} does not match evidence packet entry ${entry.unit_id} for ${citation.evidence_id}`,
      );
    }

    if (!registryUnitIds.has(citation.unit_id)) {
      errors.push(
        `citations[${index}] unit_id ${citation.unit_id} is not present in the evidence packet`,
      );
    }
  }

  const approvedUrls = collectApprovedEvidenceUrls(packet);
  const unapprovedUrls = findUnapprovedUrlsInAnswer(
    response.answer_text,
    approvedUrls,
  );
  for (const url of unapprovedUrls) {
    errors.push(`answer_text references URL not in evidence packet: ${url}`);
  }

  return { valid: errors.length === 0, errors };
}

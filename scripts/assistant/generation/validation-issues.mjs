/**
 * Classifies validation errors for recovery policy and operator diagnostics.
 * Error strings originate from response-schema.mjs and validate-response.mjs.
 */

/** @typedef {'schema' | 'citation_recoverable' | 'citation_integrity' | 'url_integrity' | 'presentation' | 'evidence_requirement' | 'unknown'} ValidationIssueCategory */

/** @typedef {'schema_parse' | 'evidence_integrity' | 'presentation'} ValidationStage */

/**
 * @param {string} error
 * @returns {ValidationIssueCategory}
 */
export function categorizeValidationError(error) {
  const message = error.toLowerCase();

  if (
    message.includes("must be a json object") ||
    message.includes("not valid json") ||
    message.includes("claims must be a non-empty array") ||
    message.includes(".text must be") ||
    message.includes(".attribution must be") ||
    message.includes("support_level must be") ||
    message.includes("abstained must be") ||
    message.includes("abstention_reason")
  ) {
    return "schema";
  }

  if (
    message.includes("unit_id") &&
    message.includes("does not match evidence packet entry")
  ) {
    return "citation_recoverable";
  }

  if (message.includes("duplicates evidence_id")) {
    return "citation_recoverable";
  }

  if (message.includes("references unknown evidence_id")) {
    return "citation_integrity";
  }

  if (message.includes("references url not in evidence packet")) {
    return "url_integrity";
  }

  if (
    message.includes("evidence_supported requires non-empty citations") ||
    message.includes("must not include external urls")
  ) {
    if (message.includes("evidence_supported requires")) {
      return "evidence_requirement";
    }
    return "presentation";
  }

  if (message.includes("derived answer_text must be non-empty")) {
    return "presentation";
  }

  return "unknown";
}

/**
 * @param {string[]} errors
 * @returns {Record<ValidationIssueCategory, number>}
 */
export function summarizeValidationIssues(errors) {
  /** @type {Record<ValidationIssueCategory, number>} */
  const counts = {
    schema: 0,
    citation_recoverable: 0,
    citation_integrity: 0,
    url_integrity: 0,
    presentation: 0,
    evidence_requirement: 0,
    unknown: 0,
  };

  for (const error of errors) {
    const category = categorizeValidationError(error);
    counts[category] += 1;
  }

  return counts;
}

/**
 * @param {string[]} errors
 * @returns {ValidationStage}
 */
export function inferValidationStage(errors) {
  const summary = summarizeValidationIssues(errors);
  if (summary.schema > 0) {
    return "schema_parse";
  }
  if (
    summary.citation_integrity > 0 ||
    summary.url_integrity > 0 ||
    summary.evidence_requirement > 0 ||
    summary.citation_recoverable > 0
  ) {
    return "evidence_integrity";
  }
  return "presentation";
}

/**
 * Stable codes for logs/telemetry (no raw claim text).
 *
 * @param {string[]} errors
 * @returns {string[]}
 */
export function stableValidationIssueCodes(errors) {
  /** @type {Set<string>} */
  const codes = new Set();
  const summary = summarizeValidationIssues(errors);
  for (const [category, count] of Object.entries(summary)) {
    if (count > 0) {
      codes.add(category);
    }
  }
  return [...codes];
}

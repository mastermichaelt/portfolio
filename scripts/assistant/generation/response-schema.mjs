export const SUPPORT_LEVELS = /** @type {const} */ ([
  "full",
  "partial",
  "none",
]);

/**
 * @typedef {'full' | 'partial' | 'none'} SupportLevel
 */

/**
 * @typedef {object} AssistantCitation
 * @property {string} evidence_id
 * @property {string} unit_id
 */

/**
 * @typedef {object} AssistantGenerationDiagnostics
 * @property {string} [assembly_mode]
 * @property {boolean} [truncated]
 */

/**
 * @typedef {object} AssistantGenerationResponse
 * @property {string} answer_text
 * @property {SupportLevel} support_level
 * @property {AssistantCitation[]} citations
 * @property {AssistantGenerationDiagnostics} [diagnostics]
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: AssistantGenerationResponse } | { ok: false, errors: string[] }}
 */
export function parseAssistantGenerationResponse(raw) {
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

  const answerText = value.answer_text;
  if (typeof answerText !== "string" || answerText.trim() === "") {
    errors.push("answer_text must be a non-empty string");
  }

  const supportLevel = value.support_level;
  if (
    typeof supportLevel !== "string" ||
    !SUPPORT_LEVELS.includes(/** @type {SupportLevel} */ (supportLevel))
  ) {
    errors.push(`support_level must be one of: ${SUPPORT_LEVELS.join(", ")}`);
  }

  const citations = value.citations;
  if (!Array.isArray(citations)) {
    errors.push("citations must be an array");
  } else {
    citations.forEach((citation, index) => {
      if (!isPlainObject(citation)) {
        errors.push(`citations[${index}] must be an object`);
        return;
      }
      if (typeof citation.evidence_id !== "string" || !citation.evidence_id) {
        errors.push(
          `citations[${index}].evidence_id must be a non-empty string`,
        );
      }
      if (typeof citation.unit_id !== "string" || !citation.unit_id) {
        errors.push(`citations[${index}].unit_id must be a non-empty string`);
      }
    });
  }

  let diagnostics;
  if (value.diagnostics !== undefined) {
    if (!isPlainObject(value.diagnostics)) {
      errors.push("diagnostics must be an object when present");
    } else {
      diagnostics = {
        assembly_mode:
          typeof value.diagnostics.assembly_mode === "string"
            ? value.diagnostics.assembly_mode
            : undefined,
        truncated:
          typeof value.diagnostics.truncated === "boolean"
            ? value.diagnostics.truncated
            : undefined,
      };
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      answer_text: answerText,
      support_level: /** @type {SupportLevel} */ (supportLevel),
      citations: /** @type {AssistantCitation[]} */ (citations),
      diagnostics,
    },
  };
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

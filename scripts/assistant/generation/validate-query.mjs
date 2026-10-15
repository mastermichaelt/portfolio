import { QueryValidationError } from "./errors.mjs";

const NULL_BYTE = /\0/;

/**
 * @param {string} question
 * @param {number} maxLength
 * @returns {string}
 */
export function validateAndNormalizeQuestion(question, maxLength) {
  if (typeof question !== "string") {
    throw new QueryValidationError("question must be a string");
  }

  const trimmed = question.trim();
  if (!trimmed) {
    throw new QueryValidationError("question must be non-empty");
  }

  if (trimmed.length > maxLength) {
    throw new QueryValidationError(
      `question exceeds max length (${trimmed.length} > ${maxLength})`,
    );
  }

  if (NULL_BYTE.test(trimmed)) {
    throw new QueryValidationError("question contains invalid null bytes");
  }

  return trimmed;
}

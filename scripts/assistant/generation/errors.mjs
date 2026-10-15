/**
 * Fail-closed evidence assembly: matched retrieval units must fit the budget
 * or assembly aborts before any LLM call.
 */
export class EvidenceBudgetExceeded extends Error {
  /**
   * @param {string} message
   * @param {Record<string, unknown>} [details]
   */
  constructor(message, details = {}) {
    super(message);
    this.name = "EvidenceBudgetExceeded";
    this.details = details;
  }
}

/** Structural validation or citation integrity failure after a model response. */
export class GenerationValidationError extends Error {
  /**
   * @param {string} message
   * @param {string[]} [errors]
   */
  constructor(message, errors = []) {
    super(message);
    this.name = "GenerationValidationError";
    this.errors = errors;
  }
}

/** Model returned JSON that could not be parsed or exceeded size limits. */
export class GenerationParseError extends Error {
  /**
   * @param {string} message
   * @param {Record<string, unknown>} [details]
   */
  constructor(message, details = {}) {
    super(message);
    this.name = "GenerationParseError";
    this.details = details;
  }
}

/** Query failed validation before retrieval or generation. */
export class QueryValidationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "QueryValidationError";
  }
}

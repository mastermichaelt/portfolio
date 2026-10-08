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

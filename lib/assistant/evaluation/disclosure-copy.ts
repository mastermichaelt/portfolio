export type EvaluationDisclosureConfig = {
  enabled: boolean;
};

/** Contact surface for removal requests (About identity rail — no separate privacy route). */
export const EVALUATION_REMOVAL_REQUEST_PATH = "/about";

/**
 * Visitor-facing copy when evaluation collection is disabled.
 */
export function formatEvaluationDisclosureCopy(
  config: EvaluationDisclosureConfig,
): string {
  if (!config.enabled) {
    return "Questions and answers are not stored to improve the assistant in this environment.";
  }

  return "Questions and responses may be stored to improve this assistant. You can request their removal.";
}

export type EvaluationDisclosureConfig = {
  enabled: boolean;
  retentionDays: number;
};

/**
 * Visitor-facing copy for the assistant composer. Derived from server config only
 * (enabled flag + retention days) — never includes secrets.
 */
export function formatEvaluationDisclosureCopy(
  config: EvaluationDisclosureConfig,
): string {
  if (!config.enabled) {
    return "Questions and answers are not stored to improve the assistant in this environment.";
  }

  const days = config.retentionDays;
  if (days === 1) {
    return "Questions and answers may be stored for up to 1 day to improve the assistant. They are not shared in analytics events.";
  }

  return `Questions and answers may be stored for up to ${days} days to improve the assistant. They are not shared in analytics events.`;
}

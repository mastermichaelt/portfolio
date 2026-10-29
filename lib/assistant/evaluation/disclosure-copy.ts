export type EvaluationDisclosureConfig = {
  enabled: boolean;
};

/** Contact surface for removal requests (About identity rail — no separate privacy route). */
export const EVALUATION_REMOVAL_REQUEST_PATH = "/about";

const DISABLED_DISCLOSURE_COPY =
  "Questions and answers are not stored to improve the assistant in this environment.";

const ENABLED_DISCLOSURE_LEAD =
  "Questions and responses may be stored to improve this assistant. You can ";
const ENABLED_DISCLOSURE_LINK_LABEL = "request their removal";
const ENABLED_DISCLOSURE_TRAIL = ".";

export type EvaluationDisclosurePresentation =
  | { kind: "plain"; text: string }
  | {
      kind: "link";
      lead: string;
      linkHref: string;
      linkLabel: string;
      trail: string;
    };

/**
 * Visitor-facing disclosure for the assistant composer. Single source for copy;
 * enabled mode separates link markup without changing visible wording.
 */
export function formatEvaluationDisclosureCopy(
  config: EvaluationDisclosureConfig,
): string {
  if (!config.enabled) {
    return DISABLED_DISCLOSURE_COPY;
  }

  return `${ENABLED_DISCLOSURE_LEAD}${ENABLED_DISCLOSURE_LINK_LABEL}${ENABLED_DISCLOSURE_TRAIL}`;
}

export function resolveEvaluationDisclosurePresentation(
  config: EvaluationDisclosureConfig,
): EvaluationDisclosurePresentation {
  if (!config.enabled) {
    return { kind: "plain", text: formatEvaluationDisclosureCopy(config) };
  }

  return {
    kind: "link",
    lead: ENABLED_DISCLOSURE_LEAD,
    linkHref: EVALUATION_REMOVAL_REQUEST_PATH,
    linkLabel: ENABLED_DISCLOSURE_LINK_LABEL,
    trail: ENABLED_DISCLOSURE_TRAIL,
  };
}

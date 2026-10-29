import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";

type ClaimAttribution =
  | "evidence_supported"
  | "evidence_inferred"
  | "general_knowledge"
  | "uncertain";

export const ATTRIBUTION_LABELS: Record<ClaimAttribution, string> = {
  evidence_supported: "Evidence-supported",
  evidence_inferred: "Inferred from evidence",
  general_knowledge: "General knowledge",
  uncertain: "Uncertain",
};

export function abstentionMessage(
  reason: AssistantPublicAnswer["abstention_reason"],
): string {
  switch (reason) {
    case "no_retrieval_hits":
      return "I could not find relevant portfolio evidence for that question.";
    case "irrelevant_evidence":
      return "The retrieved evidence did not support a confident answer.";
    case "unsupported_personal_claim":
      return "I cannot verify that personal detail from published portfolio evidence.";
    case "conflicting_evidence":
      return "Published evidence conflicts, so I am not stating a single answer.";
    case "policy_refusal":
      return "I cannot help with that request.";
    case "other":
      return "I am not able to answer that with enough confidence.";
    default:
      return "I am not able to answer that with enough confidence.";
  }
}

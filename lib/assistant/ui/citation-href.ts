import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";

type PublicCitation = NonNullable<
  AssistantPublicAnswer["claims"][number]["citations"]
>[number];

/**
 * Public generation API citations expose `evidence_id` and `unit_id` only —
 * not an authoritative source URL per citation. Until the contract adds one,
 * citations are inspectable labels, not links (claim prose may still linkify
 * inline URLs separately via {@link SafeClaimText}).
 */
export function resolveCitationHref(citation: PublicCitation): null {
  void citation;
  return null;
}

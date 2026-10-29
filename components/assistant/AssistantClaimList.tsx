"use client";

import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";
import { ATTRIBUTION_LABELS } from "@/lib/assistant/ui/attribution-copy";
import { SafeClaimText } from "@/lib/assistant/ui/SafeClaimText";

import { AssistantCitationLinks } from "./AssistantCitationLinks";

type Claim = AssistantPublicAnswer["claims"][number];

function attributionClass(attribution: Claim["attribution"]): string {
  return `assistant-claim assistant-claim--${attribution.replace(/_/g, "-")}`;
}

export function AssistantClaimBlock({
  claim,
  presentation = "inspectable",
}: {
  claim: Claim;
  presentation?: "inspectable" | "conversational";
}) {
  if (presentation === "conversational") {
    return null;
  }
  const showQualifier =
    claim.attribution === "uncertain" ||
    claim.attribution === "evidence_inferred";

  return (
    <article className={attributionClass(claim.attribution)}>
      <p className="assistant-claim-meta">
        <span className="assistant-claim-label">
          {ATTRIBUTION_LABELS[claim.attribution]}
        </span>
        {showQualifier ? (
          <span className="assistant-claim-qualifier">
            {claim.attribution === "uncertain"
              ? "Treat as qualified."
              : "Reasonable inference from retrieved evidence."}
          </span>
        ) : null}
      </p>
      <p className="assistant-claim-text">
        <SafeClaimText text={claim.text} />
      </p>
      {claim.citations?.length ? (
        <AssistantCitationLinks citations={claim.citations} />
      ) : null}
    </article>
  );
}

export function AssistantClaimList({
  claims,
}: {
  claims: AssistantPublicAnswer["claims"];
}) {
  return (
    <div className="assistant-claims" role="region" aria-label="Answer">
      {claims.map((claim, index) => (
        <AssistantClaimBlock
          key={`${index}-${claim.text.slice(0, 32)}`}
          claim={claim}
        />
      ))}
    </div>
  );
}

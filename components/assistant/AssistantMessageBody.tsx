"use client";

import Link from "next/link";

import { ExternalLink } from "@/components/ExternalLink";
import type { AssistantPublicCitation } from "@/lib/assistant/api/public-envelope";
import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";
import {
  buildCitationNumbering,
  citationIdentityKey,
  numbersForClaimCitations,
} from "@/lib/assistant/ui/citation-numbering";
import { SafeClaimText } from "@/lib/assistant/ui/SafeClaimText";
import { toVisitorHref } from "@/lib/assistant/ui/visitor-href";

import { AssistantClaimBlock } from "./AssistantClaimList";

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function citationLabel(citation: AssistantPublicCitation): string {
  return citation.source_label?.trim() || `Source ${citation.evidence_id}`;
}

function InlineRef({
  number,
  citation,
}: {
  number: number;
  citation: AssistantPublicCitation;
}) {
  const label = citationLabel(citation);
  const aria = `Source ${number}: ${label}`;
  const publicUrl = citation.source_url?.trim();
  const href = publicUrl ? toVisitorHref(publicUrl) : null;
  const marker = `[${number}]`;

  if (!href) {
    return (
      <span className="assistant-inline-citation" aria-label={aria}>
        {marker}
      </span>
    );
  }

  if (isExternalHref(href)) {
    return (
      <ExternalLink
        href={href}
        className="assistant-inline-citation assistant-inline-citation--link"
        aria-label={aria}
      >
        {marker}
      </ExternalLink>
    );
  }

  return (
    <Link
      href={href}
      className="assistant-inline-citation assistant-inline-citation--link"
      aria-label={aria}
    >
      {marker}
    </Link>
  );
}

function NumberedSourceList({
  numbering,
}: {
  numbering: ReturnType<typeof buildCitationNumbering>;
}) {
  if (numbering.ordered.length === 0) {
    return null;
  }

  return (
    <ol className="assistant-sources-list">
      {numbering.ordered.map(({ number, citation }) => {
        const label = citationLabel(citation);
        const publicUrl = citation.source_url?.trim();
        const href = publicUrl ? toVisitorHref(publicUrl) : null;

        return (
          <li key={citationIdentityKey(citation)}>
            <span className="assistant-sources-index">[{number}]</span>{" "}
            {href ? (
              isExternalHref(href) ? (
                <ExternalLink href={href}>{label}</ExternalLink>
              ) : (
                <Link href={href}>{label}</Link>
              )
            ) : (
              <span>{label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function AssistantMessageBody({
  claims,
}: {
  claims: AssistantPublicAnswer["claims"];
}) {
  const numbering = buildCitationNumbering(claims);
  const hasAttributionPanel = claims.length > 0 || numbering.ordered.length > 0;

  return (
    <div className="assistant-message-body">
      <div className="assistant-message-prose">
        {claims.map((claim, index) => {
          const numbers = numbersForClaimCitations(
            claim.citations,
            numbering.keyToNumber,
          );
          return (
            <p
              key={`${index}-${claim.text.slice(0, 24)}`}
              className="assistant-message-paragraph"
            >
              <SafeClaimText text={claim.text} />
              {numbers.map((number) => {
                const citation = numbering.ordered.find(
                  (entry) => entry.number === number,
                )?.citation;
                if (!citation) {
                  return null;
                }
                return (
                  <InlineRef
                    key={`${number}-${citationIdentityKey(citation)}`}
                    number={number}
                    citation={citation}
                  />
                );
              })}
            </p>
          );
        })}
      </div>

      {hasAttributionPanel ? (
        <details className="assistant-sources-details">
          <summary>Sources &amp; attribution</summary>
          <div className="assistant-sources-panel">
            <NumberedSourceList numbering={numbering} />
            <div className="assistant-sources-claims">
              {claims.map((claim, index) => (
                <AssistantClaimBlock
                  key={`detail-${index}-${claim.text.slice(0, 24)}`}
                  claim={claim}
                  presentation="inspectable"
                />
              ))}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}

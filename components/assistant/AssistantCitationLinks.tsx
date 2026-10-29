"use client";

import Link from "next/link";

import { ExternalLink } from "@/components/ExternalLink";
import type { AssistantPublicCitation } from "@/lib/assistant/api/public-envelope";
import { toVisitorHref } from "@/lib/assistant/ui/visitor-href";

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function AssistantCitationLinks({
  citations,
}: {
  citations: AssistantPublicCitation[];
}) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <ul className="assistant-citations" aria-label="Evidence citations">
      {citations.map((citation) => {
        const label =
          citation.source_label?.trim() || `Source ${citation.evidence_id}`;
        const detail = `${citation.evidence_id} · ${citation.unit_id}`;
        const publicUrl = citation.source_url?.trim();
        const href = publicUrl ? toVisitorHref(publicUrl) : null;

        return (
          <li key={`${citation.evidence_id}-${citation.unit_id}`}>
            {href ? (
              isExternalHref(href) ? (
                <ExternalLink href={href} title={detail}>
                  {label}
                  <span className="sr-only"> ({detail})</span>
                </ExternalLink>
              ) : (
                <Link href={href} title={detail}>
                  {label}
                  <span className="sr-only"> ({detail})</span>
                </Link>
              )
            ) : (
              <span className="assistant-citation-static" title={detail}>
                {label}
                <span className="sr-only"> ({detail})</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

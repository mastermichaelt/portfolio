"use client";

import Link from "next/link";

import { ExternalLink } from "@/components/ExternalLink";
import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";
import { resolveCitationHref } from "@/lib/assistant/ui/citation-href";

type Citation = NonNullable<
  AssistantPublicAnswer["claims"][number]["citations"]
>[number];

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function AssistantCitationLinks({
  claimText,
  citations,
}: {
  claimText: string;
  citations: Citation[];
}) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <ul className="assistant-citations" aria-label="Evidence citations">
      {citations.map((citation, index) => {
        const href = resolveCitationHref(citation.unit_id, claimText, index);
        const label = `Source ${citation.evidence_id}`;

        return (
          <li key={`${citation.evidence_id}-${citation.unit_id}`}>
            {href ? (
              isExternalHref(href) ? (
                <ExternalLink href={href}>{label}</ExternalLink>
              ) : (
                <Link href={href}>{label}</Link>
              )
            ) : (
              <span className="assistant-citation-static">{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";

type Citation = NonNullable<
  AssistantPublicAnswer["claims"][number]["citations"]
>[number];

export function AssistantCitationLinks({
  citations,
}: {
  citations: Citation[];
}) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <ul className="assistant-citations" aria-label="Evidence citations">
      {citations.map((citation) => {
        const label = `Source ${citation.evidence_id}`;
        const detail = `${citation.evidence_id} · ${citation.unit_id}`;

        return (
          <li key={`${citation.evidence_id}-${citation.unit_id}`}>
            <span className="assistant-citation-static" title={detail}>
              {label}
              <span className="sr-only"> ({detail})</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

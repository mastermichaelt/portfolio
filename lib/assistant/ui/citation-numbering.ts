import type { AssistantPublicCitation } from "@/lib/assistant/api/public-envelope";
import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";

export function citationIdentityKey(citation: AssistantPublicCitation): string {
  return `${citation.evidence_id}:${citation.unit_id}`;
}

export type NumberedCitation = {
  number: number;
  citation: AssistantPublicCitation;
};

export type CitationNumbering = {
  keyToNumber: ReadonlyMap<string, number>;
  ordered: readonly NumberedCitation[];
};

/** Stable [n] indices for inline refs; dedupe evidence_id + unit_id within one answer. */
export function buildCitationNumbering(
  claims: AssistantPublicAnswer["claims"],
): CitationNumbering {
  const keyToNumber = new Map<string, number>();
  const ordered: NumberedCitation[] = [];

  for (const claim of claims) {
    for (const citation of claim.citations ?? []) {
      const key = citationIdentityKey(citation);
      if (keyToNumber.has(key)) {
        continue;
      }
      const number = ordered.length + 1;
      keyToNumber.set(key, number);
      ordered.push({ number, citation });
    }
  }

  return { keyToNumber, ordered };
}

export function numbersForClaimCitations(
  citations: AssistantPublicCitation[] | undefined,
  keyToNumber: ReadonlyMap<string, number>,
): number[] {
  if (!citations?.length) {
    return [];
  }

  const seen = new Set<string>();
  const numbers: number[] = [];

  for (const citation of citations) {
    const key = citationIdentityKey(citation);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const number = keyToNumber.get(key);
    if (number !== undefined) {
      numbers.push(number);
    }
  }

  return numbers;
}

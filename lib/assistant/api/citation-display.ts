import { normalizeEvidenceUrl } from "@/scripts/assistant/generation/approved-urls.mjs";

/** Evidence packet entry fields used for visitor citation display (server-trusted). */
export type EvidenceEntryForCitationDisplay = {
  evidence_id: string;
  unit_id: string;
  okf_concept_id: string;
  title?: string;
  resource?: string;
  sources?: unknown;
};

export type CitationDisplayMetadata = {
  source_label: string;
  source_url?: string;
};

type RetrievalSourceLike = {
  resource?: string;
  url?: string;
  title?: string;
};

const GENERIC_SITE_PATHS = new Set([
  "/",
  "/articles",
  "/projects",
  "/ecosystem",
]);

function citationLookupKey(evidenceId: string, unitId: string): string {
  return `${evidenceId}\u0000${unitId}`;
}

function urlsFromSourcesJson(sources: unknown): string[] {
  if (!Array.isArray(sources)) {
    return [];
  }

  const urls: string[] = [];
  for (const item of sources) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const source = item as RetrievalSourceLike;
    for (const candidate of [source.resource, source.url]) {
      if (typeof candidate !== "string") {
        continue;
      }
      const normalized = normalizeEvidenceUrl(candidate);
      if (normalized) {
        urls.push(normalized);
      }
    }
  }
  return urls;
}

function humanizeOkfConceptId(okfConceptId: string): string {
  const segment = okfConceptId.split("/").pop() ?? okfConceptId;
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isSpecificPublicDestination(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "") || "/";
    if (
      (parsed.hostname === "michaeltruong.ai" ||
        parsed.hostname === "www.michaeltruong.ai") &&
      GENERIC_SITE_PATHS.has(path)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function pickPublicCitationUrl(
  entry: EvidenceEntryForCitationDisplay,
): string | undefined {
  const candidates: string[] = [];

  if (typeof entry.resource === "string") {
    candidates.push(entry.resource);
  }
  candidates.push(...urlsFromSourcesJson(entry.sources));

  for (const raw of candidates) {
    const normalized = normalizeEvidenceUrl(raw);
    if (normalized && isSpecificPublicDestination(normalized)) {
      return normalized;
    }
  }

  return undefined;
}

export function resolveCitationDisplayForEntry(
  entry: EvidenceEntryForCitationDisplay,
): CitationDisplayMetadata {
  const trimmedTitle = entry.title?.trim();
  const source_label =
    trimmedTitle && trimmedTitle.length > 0
      ? trimmedTitle
      : humanizeOkfConceptId(entry.okf_concept_id);

  const source_url = pickPublicCitationUrl(entry);
  return source_url ? { source_label, source_url } : { source_label };
}

export function buildEvidenceDisplayByCitationKey(
  entries: EvidenceEntryForCitationDisplay[],
): Map<string, CitationDisplayMetadata> {
  const map = new Map<string, CitationDisplayMetadata>();
  for (const entry of entries) {
    map.set(
      citationLookupKey(entry.evidence_id, entry.unit_id),
      resolveCitationDisplayForEntry(entry),
    );
  }
  return map;
}

export function lookupCitationDisplay(
  displayByKey: Map<string, CitationDisplayMetadata>,
  evidenceId: string,
  unitId: string,
): CitationDisplayMetadata | undefined {
  return displayByKey.get(citationLookupKey(evidenceId, unitId));
}

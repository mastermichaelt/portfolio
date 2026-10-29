import { extractHttpUrlsFromText } from "@/lib/assistant/ui/extract-http-urls";

/** Known portfolio project slugs for unit_id → on-site href heuristics. */
const PORTFOLIO_PROJECT_SLUGS = [
  "codenames-ai",
  "experiment-measurement",
] as const;

const SUPPORTING_CASE_SLUGS = [
  "editorial-workflow",
  "renovate-governance",
] as const;

const ALL_KNOWN_SLUGS = [
  ...PORTFOLIO_PROJECT_SLUGS,
  ...SUPPORTING_CASE_SLUGS,
] as const;

function longestMatchingSlug(segment: string): string | null {
  const normalized = segment.toLowerCase();
  let best: string | null = null;
  for (const slug of ALL_KNOWN_SLUGS) {
    if (
      normalized === slug ||
      normalized.startsWith(`${slug}-`) ||
      normalized.startsWith(`${slug}_`)
    ) {
      if (!best || slug.length > best.length) {
        best = slug;
      }
    }
  }
  return best;
}

function hrefFromUnitId(unitId: string): string | null {
  const withoutPrefix = unitId.replace(/^unit\//, "");
  const [sourceClass, ...restParts] = withoutPrefix.split("/");
  if (!sourceClass || restParts.length === 0) {
    return null;
  }

  const tail = restParts.join("/").split("#")[0] ?? "";

  if (sourceClass === "about") {
    return "/about";
  }

  if (sourceClass === "writing") {
    return "/articles";
  }

  if (sourceClass === "portfolio") {
    const slug = longestMatchingSlug(tail);
    if (slug) {
      return `/projects/${slug}`;
    }
  }

  return null;
}

function isSameSiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "michaeltruong.ai" ||
      parsed.hostname === "www.michaeltruong.ai" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function toVisitorHref(url: string): string {
  if (!isSameSiteUrl(url)) {
    return url;
  }
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return url;
  }
}

/**
 * Resolve a clickable href for a citation. Prefer inline URLs from claim text
 * (OpenAI-validated against the evidence packet); fall back to unit_id heuristics.
 */
export function resolveCitationHref(
  unitId: string,
  claimText: string,
  citationIndex: number,
): string | null {
  const inlineUrls = extractHttpUrlsFromText(claimText);
  if (inlineUrls[citationIndex]) {
    return toVisitorHref(inlineUrls[citationIndex]);
  }
  if (inlineUrls.length === 1 && citationIndex === 0) {
    return toVisitorHref(inlineUrls[0]);
  }

  return hrefFromUnitId(unitId);
}

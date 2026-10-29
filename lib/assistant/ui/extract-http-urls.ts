/**
 * Visitor-safe URL extraction for linkifying assistant claim text.
 * Mirrors {@link extractHttpUrlsFromText} in approved-urls.mjs (client-safe subset).
 */

export function normalizeHttpUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    parsed.hash = "";
    return parsed.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function extractHttpUrlsFromText(text: string): string[] {
  if (typeof text !== "string" || text === "") {
    return [];
  }

  const pattern = /https?:\/\/[^\s<>"')\]]+/gi;
  const found: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(pattern)) {
    const raw = match[0].replace(/[.,;:!?)]+$/, "");
    const normalized = normalizeHttpUrl(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      found.push(normalized);
    }
  }

  return found;
}

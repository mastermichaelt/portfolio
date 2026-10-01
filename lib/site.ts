const DEFAULT_SITE_URL = "https://michaeltruong.ai";

function normalizeSiteUrl(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return DEFAULT_SITE_URL;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Canonical production origin (HTTPS only). */
export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

/** Hostname for the canonical production origin. */
export function getSiteHostname(): string {
  return new URL(getSiteUrl()).hostname;
}

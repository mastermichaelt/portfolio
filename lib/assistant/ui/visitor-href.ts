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

/** Normalize absolute site URLs to path-only links for in-app navigation. */
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

/**
 * Derive a stable rate-limit client key from proxy headers (Vercel sets x-forwarded-for).
 */
export function resolveClientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return `ip:${first}`;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return `ip:${realIp}`;
  }

  return "ip:unknown";
}

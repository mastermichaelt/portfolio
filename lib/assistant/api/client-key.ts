/**
 * Derive a stable rate-limit client key from proxy headers.
 *
 * **Vercel trust model:** On Vercel deployments, `x-forwarded-for` is set or
 * overwritten by the platform with the connecting client IP; visitor-supplied
 * values are not trusted as the client identity (see Vercel request headers
 * docs: external IPs are not forwarded by default to prevent spoofing). The
 * first comma-separated entry is therefore the client IP on michaeltruong.ai.
 *
 * Local/dev requests without a proxy may omit these headers — those collapse to
 * `ip:unknown` for rate limiting.
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

export type AnalyticsEnvironment = "production" | "preview" | "local" | "e2e";

/** Stable production host for runtime fallback when Vercel env is absent. */
const PRODUCTION_HOSTNAME = "portfolio-multipliers-dev.vercel.app";

function isE2eHost(hostname: string | undefined): boolean {
  return hostname === "127.0.0.1";
}

/** Resolve analytics_environment for PostHog super properties and dashboard filters. */
export function resolveAnalyticsEnvironment(): AnalyticsEnvironment {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : undefined;
  if (isE2eHost(hostname)) return "e2e";

  if (process.env.NODE_ENV === "development") return "local";

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV?.trim();
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "production") return "production";

  if (hostname === PRODUCTION_HOSTNAME) return "production";

  return "preview";
}

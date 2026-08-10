import posthog from "posthog-js";

import { resolveAnalyticsEnvironment } from "@/lib/analyticsEnvironment";

type CaptureProps = Record<string, string | number | boolean>;

function projectToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
  return token || undefined;
}

function isAnalyticsConfigured(): boolean {
  return Boolean(projectToken());
}

/**
 * Initialize PostHog when a public project token is present.
 * No-ops when unset so local/CI stay quiet without secrets.
 */
export function initPosthog(): void {
  const token = projectToken();
  if (!token) return;

  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  const analyticsEnvironment = resolveAnalyticsEnvironment();

  posthog.init(token, {
    api_host: apiHost,
    defaults: "2026-05-30",
    autocapture: false,
    disable_session_recording: true,
  });
  posthog.register({ analytics_environment: analyticsEnvironment });
}

/** Capture a custom event when PostHog is configured; otherwise a safe no-op. */
export function captureEvent(event: string, properties?: CaptureProps): void {
  if (!isAnalyticsConfigured()) return;
  posthog.capture(event, properties);
}

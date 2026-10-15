import type { Pool } from "pg";

import type { AssistantApiConfig } from "./config";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

type RateLimitWindow = {
  name: string;
  windowMs: number;
  limit: number;
  scope: "client" | "global";
};

function buildWindows(config: AssistantApiConfig): RateLimitWindow[] {
  return [
    {
      name: "minute",
      windowMs: MS_PER_MINUTE,
      limit: config.perClientPerMinute,
      scope: "client",
    },
    {
      name: "hour",
      windowMs: MS_PER_HOUR,
      limit: config.perClientPerHour,
      scope: "client",
    },
    {
      name: "day",
      windowMs: MS_PER_DAY,
      limit: config.perClientPerDay,
      scope: "client",
    },
    {
      name: "global_day",
      windowMs: MS_PER_DAY,
      limit: config.globalPerDay,
      scope: "global",
    },
  ];
}

function bucketKey(
  scope: "client" | "global",
  clientKey: string,
  window: RateLimitWindow,
  nowMs: number,
): string {
  const windowIndex = Math.floor(nowMs / window.windowMs);
  const subject = scope === "global" ? "global" : clientKey;
  return `${subject}:${window.name}:${windowIndex}`;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; window: string };

/**
 * Increment durable counters and enforce configured windows. Fails closed when the
 * database is unavailable (treat as not allowed).
 */
export async function checkAssistantApiRateLimit(
  pool: Pool,
  clientKey: string,
  config: AssistantApiConfig,
  nowMs = Date.now(),
): Promise<RateLimitResult> {
  if (!config.rateLimitEnabled) {
    return { allowed: true };
  }

  const windows = buildWindows(config);

  try {
    for (const window of windows) {
      const key = bucketKey(window.scope, clientKey, window, nowMs);
      const windowEndsAt = new Date(
        (Math.floor(nowMs / window.windowMs) + 1) * window.windowMs,
      );

      const result = await pool.query<{ count: string }>(
        `
        INSERT INTO assistant_api_rate_limit_counters (bucket_key, count, window_ends_at)
        VALUES ($1, 1, $2)
        ON CONFLICT (bucket_key) DO UPDATE
        SET count = assistant_api_rate_limit_counters.count + 1
        RETURNING count
        `,
        [key, windowEndsAt],
      );

      const count = Number(result.rows[0]?.count ?? 0);
      if (count > window.limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((windowEndsAt.getTime() - nowMs) / 1000),
        );
        return {
          allowed: false,
          retryAfterSeconds,
          window: window.name,
        };
      }
    }

    // Best-effort expiry cleanup — does not affect the current decision.
    await pool.query(
      `DELETE FROM assistant_api_rate_limit_counters WHERE window_ends_at < now()`,
    );

    return { allowed: true };
  } catch {
    return {
      allowed: false,
      retryAfterSeconds: 60,
      window: "storage_unavailable",
    };
  }
}

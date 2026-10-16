import type { Pool, PoolClient } from "pg";

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

type RateLimitBucket = {
  key: string;
  windowEndsAt: Date;
  limit: number;
  windowName: string;
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

function buildBuckets(
  clientKey: string,
  config: AssistantApiConfig,
  nowMs: number,
): RateLimitBucket[] {
  const windows = buildWindows(config);
  const buckets = windows.map((window) => {
    const windowEndsAt = new Date(
      (Math.floor(nowMs / window.windowMs) + 1) * window.windowMs,
    );
    return {
      key: bucketKey(window.scope, clientKey, window, nowMs),
      windowEndsAt,
      limit: window.limit,
      windowName: window.name,
    };
  });

  return buckets.sort((a, b) => a.key.localeCompare(b.key));
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; window: string };

const INCREMENT_COUNTER_SQL = `
  INSERT INTO assistant_api_rate_limit_counters (bucket_key, count, window_ends_at)
  VALUES ($1, 1, $2)
  ON CONFLICT (bucket_key) DO UPDATE
  SET count = assistant_api_rate_limit_counters.count + 1
  RETURNING count
`;

/**
 * Delete expired counters. Failures are swallowed — never affects admission.
 */
export async function expireRateLimitCountersBestEffort(
  pool: Pool,
): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM assistant_api_rate_limit_counters WHERE window_ends_at < now()`,
    );
  } catch {
    // Best-effort housekeeping only.
  }
}

async function admitInTransaction(
  client: PoolClient,
  buckets: RateLimitBucket[],
  nowMs: number,
): Promise<RateLimitResult> {
  await client.query("BEGIN");

  try {
    for (const bucket of buckets) {
      const result = await client.query<{ count: string }>(
        INCREMENT_COUNTER_SQL,
        [bucket.key, bucket.windowEndsAt],
      );

      const count = Number(result.rows[0]?.count ?? 0);
      if (count > bucket.limit) {
        await client.query("ROLLBACK");
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((bucket.windowEndsAt.getTime() - nowMs) / 1000),
        );
        return {
          allowed: false,
          retryAfterSeconds,
          window: bucket.windowName,
        };
      }
    }

    await client.query("COMMIT");
    return { allowed: true };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

/**
 * Increment durable counters and enforce configured windows in one transaction.
 * Fails closed when the database is unavailable.
 */
export async function checkAssistantApiRateLimit(
  pool: Pool,
  clientKey: string,
  config: AssistantApiConfig,
  nowMs = Date.now(),
  options: { runExpiryCleanup?: boolean } = {},
): Promise<RateLimitResult> {
  if (!config.rateLimitEnabled) {
    return { allowed: true };
  }

  const buckets = buildBuckets(clientKey, config, nowMs);
  const runExpiryCleanup = options.runExpiryCleanup ?? true;

  let client: PoolClient | undefined;
  let decision: RateLimitResult;
  try {
    client = await pool.connect();
    decision = await admitInTransaction(client, buckets, nowMs);
  } catch {
    return {
      allowed: false,
      retryAfterSeconds: 60,
      window: "storage_unavailable",
    };
  } finally {
    client?.release();
  }

  if (decision.allowed && runExpiryCleanup) {
    await expireRateLimitCountersBestEffort(pool);
  }

  return decision;
}

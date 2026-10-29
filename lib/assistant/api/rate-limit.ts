import type pg from "pg";

import { createAssistantDb } from "@/db/client";
import type { AssistantApiConfig } from "@/lib/assistant/api/config";
import {
  checkAssistantApiRateLimitOnDb,
  expireRateLimitCountersBestEffort,
} from "@/lib/assistant/db/rate-limit";
import { buildRateLimitBuckets } from "@/lib/assistant/db/rate-limit-policy";

export type { RateLimitResult } from "@/lib/assistant/db/rate-limit-policy";

export { expireRateLimitCountersBestEffort };

/**
 * Increment durable counters and enforce configured windows in one transaction.
 * Fails closed when the database is unavailable.
 */
export async function checkAssistantApiRateLimit(
  pool: pg.Pool,
  clientKey: string,
  config: AssistantApiConfig,
  nowMs = Date.now(),
  options: { runExpiryCleanup?: boolean } = {},
) {
  if (!config.rateLimitEnabled) {
    return { allowed: true as const };
  }

  const db = createAssistantDb(pool);
  const buckets = buildRateLimitBuckets(clientKey, config, nowMs);
  return checkAssistantApiRateLimitOnDb(db, buckets, nowMs, options);
}

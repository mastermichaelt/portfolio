import { lt, sql } from "drizzle-orm";

import type { AssistantDb } from "@/db/client";
import { assistantApiRateLimitCounters } from "@/db/schema";

import type {
  RateLimitBucket,
  RateLimitResult,
} from "@/lib/assistant/db/rate-limit-policy";

export type { RateLimitResult } from "@/lib/assistant/db/rate-limit-policy";

/**
 * Delete expired counters. Failures are swallowed — never affects admission.
 */
export async function expireRateLimitCountersBestEffort(
  db: AssistantDb,
): Promise<void> {
  try {
    await db
      .delete(assistantApiRateLimitCounters)
      .where(lt(assistantApiRateLimitCounters.windowEndsAt, sql`now()`));
  } catch {
    // Best-effort housekeeping only.
  }
}

async function admitInTransaction(
  db: AssistantDb,
  buckets: RateLimitBucket[],
  nowMs: number,
): Promise<RateLimitResult> {
  class RateLimitExceeded extends Error {
    readonly result: RateLimitResult;

    constructor(result: RateLimitResult) {
      super("rate_limit_exceeded");
      this.result = result;
    }
  }

  try {
    return await db.transaction(async (tx) => {
      for (const bucket of buckets) {
        const [row] = await tx
          .insert(assistantApiRateLimitCounters)
          .values({
            bucketKey: bucket.key,
            count: 1,
            windowEndsAt: bucket.windowEndsAt,
          })
          .onConflictDoUpdate({
            target: assistantApiRateLimitCounters.bucketKey,
            set: {
              count: sql`${assistantApiRateLimitCounters.count} + 1`,
            },
          })
          .returning({ count: assistantApiRateLimitCounters.count });

        const count = Number(row?.count ?? 0);
        if (count > bucket.limit) {
          throw new RateLimitExceeded({
            allowed: false,
            retryAfterSeconds: Math.max(
              1,
              Math.ceil((bucket.windowEndsAt.getTime() - nowMs) / 1000),
            ),
            window: bucket.windowName,
          });
        }
      }

      return { allowed: true };
    });
  } catch (error) {
    if (error instanceof RateLimitExceeded) {
      return error.result;
    }
    throw error;
  }
}

/**
 * Increment durable counters and enforce configured windows in one transaction.
 * Fails closed when the database is unavailable.
 */
export async function checkAssistantApiRateLimitOnDb(
  db: AssistantDb,
  buckets: RateLimitBucket[],
  nowMs: number,
  options: { runExpiryCleanup?: boolean } = {},
): Promise<RateLimitResult> {
  const runExpiryCleanup = options.runExpiryCleanup ?? true;

  let decision: RateLimitResult;
  try {
    decision = await admitInTransaction(db, buckets, nowMs);
  } catch {
    return {
      allowed: false,
      retryAfterSeconds: 60,
      window: "storage_unavailable",
    };
  }

  if (decision.allowed && runExpiryCleanup) {
    await expireRateLimitCountersBestEffort(db);
  }

  return decision;
}

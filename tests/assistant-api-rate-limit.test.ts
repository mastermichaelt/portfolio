import { randomUUID } from "node:crypto";
import fs from "node:fs";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  checkAssistantApiRateLimit,
  expireRateLimitCountersBestEffort,
} from "@/lib/assistant/api/rate-limit";
import type { AssistantApiConfig } from "@/lib/assistant/api/config";
import { createPool } from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";
import { runMigrations } from "@/scripts/assistant/db/migrate.mjs";

let rateLimitTestDatabaseUrl: string | undefined;
try {
  rateLimitTestDatabaseUrl = resolveAssistantIngestTestDatabaseUrl();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Misconfigured ASSISTANT_TEST_DATABASE_URL for rate limit integration tests: ${message}`,
  );
}
const hasRateLimitTestDatabase = Boolean(rateLimitTestDatabaseUrl);

function testConfig(
  overrides: Partial<AssistantApiConfig> = {},
): AssistantApiConfig {
  return {
    maxBodyBytes: 16_384,
    rateLimitEnabled: true,
    perClientPerMinute: 5,
    perClientPerHour: 50,
    perClientPerDay: 200,
    globalPerDay: 500,
    ...overrides,
  };
}

async function readCounter(
  pool: import("pg").Pool,
  bucketKey: string,
): Promise<number | null> {
  const result = await pool.query<{ count: string }>(
    `SELECT count FROM assistant_api_rate_limit_counters WHERE bucket_key = $1`,
    [bucketKey],
  );
  if (result.rowCount === 0) {
    return null;
  }
  return Number(result.rows[0]?.count ?? 0);
}

describe("assistant API rate limit", () => {
  it("fails closed when pool.connect() cannot reach Postgres", async () => {
    const badPool = createPool("postgresql://invalid:invalid@127.0.0.1:1/none");
    const result = await checkAssistantApiRateLimit(
      badPool,
      "ip:test",
      testConfig(),
      Date.UTC(2026, 9, 16, 12, 0, 0),
      { runExpiryCleanup: false },
    );
    await badPool.end();

    expect(result).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
      window: "storage_unavailable",
    });
  });
});

describe("assistant API rate limit (integration)", () => {
  it("documents skip when ASSISTANT_TEST_DATABASE_URL is unset", () => {
    if (!hasRateLimitTestDatabase) {
      console.info(
        "assistant API rate limit integration tests skipped: ASSISTANT_TEST_DATABASE_URL not set",
      );
    }
    expect(true).toBe(true);
  });

  it("does not run Postgres integration against DATABASE_URL", () => {
    const source = fs.readFileSync(
      new URL("./assistant-api-rate-limit.test.ts", import.meta.url),
      "utf8",
    );
    const marker =
      'describe.skipIf(!hasRateLimitTestDatabase)("with ASSISTANT_TEST_DATABASE_URL"';
    expect(source.indexOf(marker)).toBeGreaterThan(-1);
    expect(source).not.toMatch(
      /describe\.skipIf\(!hasDatabase\)\("with DATABASE_URL"/,
    );
  });

  describe.skipIf(!hasRateLimitTestDatabase)(
    "with ASSISTANT_TEST_DATABASE_URL",
    () => {
      let pool: import("pg").Pool;
      let postgresIntegrationReady = false;
      const fixedNow = Date.UTC(2026, 9, 16, 12, 0, 0);

      beforeAll(async () => {
        pool = createPool(rateLimitTestDatabaseUrl!);
        try {
          await pool.query("SELECT 1");
          await runMigrations(pool, { log: () => {} });
          postgresIntegrationReady = true;
        } catch {
          postgresIntegrationReady = false;
          await pool.end().catch(() => {});
        }
      });

      afterAll(async () => {
        if (postgresIntegrationReady) {
          await pool.end();
        }
      });

      beforeEach(async (context) => {
        if (!postgresIntegrationReady) {
          context.skip();
          return;
        }
        await pool.query(`DELETE FROM assistant_api_rate_limit_counters`);
      });

      it("admits once and increments all four windows atomically", async () => {
        const clientKey = `ip:test-${randomUUID()}`;
        const config = testConfig();

        const result = await checkAssistantApiRateLimit(
          pool,
          clientKey,
          config,
          fixedNow,
          { runExpiryCleanup: false },
        );
        expect(result).toEqual({ allowed: true });

        const minuteKey = `${clientKey}:minute:${Math.floor(fixedNow / 60_000)}`;
        const hourKey = `${clientKey}:hour:${Math.floor(fixedNow / 3_600_000)}`;
        const dayKey = `${clientKey}:day:${Math.floor(fixedNow / 86_400_000)}`;
        const globalKey = `global:global_day:${Math.floor(fixedNow / 86_400_000)}`;

        expect(await readCounter(pool, minuteKey)).toBe(1);
        expect(await readCounter(pool, hourKey)).toBe(1);
        expect(await readCounter(pool, dayKey)).toBe(1);
        expect(await readCounter(pool, globalKey)).toBe(1);
      });

      it("rejects minute window without consuming hour quota on rollback", async () => {
        const clientKey = `ip:test-${randomUUID()}`;
        const config = testConfig({
          perClientPerMinute: 1,
          perClientPerHour: 10,
        });

        expect(
          await checkAssistantApiRateLimit(pool, clientKey, config, fixedNow, {
            runExpiryCleanup: false,
          }),
        ).toEqual({ allowed: true });

        const rejected = await checkAssistantApiRateLimit(
          pool,
          clientKey,
          config,
          fixedNow,
          { runExpiryCleanup: false },
        );
        expect(rejected.allowed).toBe(false);
        if (rejected.allowed) {
          throw new Error("expected rejection");
        }
        expect(rejected.window).toBe("minute");

        const hourKey = `${clientKey}:hour:${Math.floor(fixedNow / 3_600_000)}`;
        expect(await readCounter(pool, hourKey)).toBe(1);
      });

      it("rejects hour, client-day, and global-day windows independently", async () => {
        const hourClient = `ip:test-hour-${randomUUID()}`;
        const hourConfig = testConfig({ perClientPerHour: 1 });
        expect(
          await checkAssistantApiRateLimit(
            pool,
            hourClient,
            hourConfig,
            fixedNow,
            {
              runExpiryCleanup: false,
            },
          ),
        ).toEqual({ allowed: true });
        const hourRejected = await checkAssistantApiRateLimit(
          pool,
          hourClient,
          hourConfig,
          fixedNow,
          { runExpiryCleanup: false },
        );
        expect(hourRejected.allowed).toBe(false);
        if (!hourRejected.allowed) {
          expect(hourRejected.window).toBe("hour");
        }

        const dayClient = `ip:test-day-${randomUUID()}`;
        const dayConfig = testConfig({ perClientPerDay: 1 });
        expect(
          await checkAssistantApiRateLimit(
            pool,
            dayClient,
            dayConfig,
            fixedNow,
            {
              runExpiryCleanup: false,
            },
          ),
        ).toEqual({ allowed: true });
        const dayRejected = await checkAssistantApiRateLimit(
          pool,
          dayClient,
          dayConfig,
          fixedNow,
          { runExpiryCleanup: false },
        );
        expect(dayRejected.allowed).toBe(false);
        if (!dayRejected.allowed) {
          expect(dayRejected.window).toBe("day");
        }

        await pool.query(`DELETE FROM assistant_api_rate_limit_counters`);

        const globalConfig = testConfig({ globalPerDay: 1 });
        const clientA = `ip:test-global-a-${randomUUID()}`;
        const clientB = `ip:test-global-b-${randomUUID()}`;
        expect(
          await checkAssistantApiRateLimit(
            pool,
            clientA,
            globalConfig,
            fixedNow,
            {
              runExpiryCleanup: false,
            },
          ),
        ).toEqual({ allowed: true });
        const globalRejected = await checkAssistantApiRateLimit(
          pool,
          clientB,
          globalConfig,
          fixedNow,
          { runExpiryCleanup: false },
        );
        expect(globalRejected.allowed).toBe(false);
        if (!globalRejected.allowed) {
          expect(globalRejected.window).toBe("global_day");
        }
      });

      it("enforces concurrent admission at the configured minute boundary", async () => {
        const clientKey = `ip:test-concurrent-${randomUUID()}`;
        const config = testConfig({ perClientPerMinute: 4 });

        const results = await Promise.all(
          Array.from({ length: 8 }, () =>
            checkAssistantApiRateLimit(pool, clientKey, config, fixedNow, {
              runExpiryCleanup: false,
            }),
          ),
        );

        const allowed = results.filter((result) => result.allowed).length;
        const rejected = results.filter((result) => !result.allowed).length;

        expect(allowed).toBe(4);
        expect(rejected).toBe(4);
      });

      it("does not fail admission when expiry cleanup fails after commit", async () => {
        const clientKey = `ip:test-cleanup-${randomUUID()}`;
        const config = testConfig({ perClientPerMinute: 10 });

        const originalQuery = pool.query.bind(pool);
        (pool as { query: typeof pool.query }).query = ((
          queryText: unknown,
          values?: unknown,
        ) => {
          if (
            typeof queryText === "string" &&
            queryText.includes("DELETE FROM assistant_api_rate_limit_counters")
          ) {
            throw new Error("simulated cleanup failure");
          }
          return originalQuery(queryText as string, values as never);
        }) as typeof pool.query;

        try {
          const result = await checkAssistantApiRateLimit(
            pool,
            clientKey,
            config,
            fixedNow,
          );
          expect(result).toEqual({ allowed: true });
        } finally {
          pool.query = originalQuery;
        }

        await expect(
          expireRateLimitCountersBestEffort(pool),
        ).resolves.toBeUndefined();
      });
    },
  );
});

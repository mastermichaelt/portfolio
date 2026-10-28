import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LegacyAdoptionRequiredError } from "@/scripts/assistant/db/legacy-baseline.mjs";

const { runMigrationsMock, resetMock } = vi.hoisted(() => ({
  runMigrationsMock: vi.fn(),
  resetMock: vi.fn(async () => {}),
}));

vi.mock("@/scripts/assistant/db/migrate.mjs", () => ({
  runMigrations: runMigrationsMock,
}));

vi.mock("@/scripts/assistant/db/test-database-reset.mjs", () => ({
  resetAssistantDatabaseForTests: resetMock,
}));

import {
  LEGACY_ADOPTION_INTEGRATION_TEST_HINT,
  prepareAssistantIntegrationTestDatabase,
} from "@/scripts/assistant/db/prepare-integration-test-database.mjs";

describe("prepareAssistantIntegrationTestDatabase", () => {
  beforeEach(() => {
    runMigrationsMock.mockReset();
    resetMock.mockClear();
  });

  it("resets the test database before migrating", async () => {
    runMigrationsMock.mockResolvedValue(undefined);
    const pool = { options: { connectionString: "postgresql://x/y_test" } };

    await prepareAssistantIntegrationTestDatabase(
      pool as unknown as import("pg").Pool,
      { log: () => {} },
    );

    expect(resetMock).toHaveBeenCalledOnce();
    expect(runMigrationsMock).toHaveBeenCalledOnce();
  });

  it("wraps LegacyAdoptionRequiredError with explicit failure text", async () => {
    runMigrationsMock.mockRejectedValue(
      new LegacyAdoptionRequiredError(
        "Assistant tables exist without a Drizzle journal baseline.",
      ),
    );
    const pool = { options: { connectionString: "postgresql://x/y_test" } };

    let caught: unknown;
    try {
      await prepareAssistantIntegrationTestDatabase(
        pool as unknown as import("pg").Pool,
        { log: () => {} },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    const message = caught instanceof Error ? caught.message : String(caught);
    expect(message).toMatch(/operator-only/);
    expect(message).toContain(LEGACY_ADOPTION_INTEGRATION_TEST_HINT);
  });

  it("rate-limit integration does not swallow Postgres setup failures", () => {
    const source = fs.readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "assistant-api-rate-limit.test.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(
      /describe\.skipIf\(!hasDatabase\)\("with DATABASE_URL"/,
    );
    const match = source.match(
      /describe\.skipIf\(!hasRateLimitTestDatabase\)\([\s\S]*?\n    \},\n  \);/,
    );
    expect(match, "ASSISTANT_TEST_DATABASE_URL integration block").toBeTruthy();
    const block = match![0]!;
    expect(block).not.toMatch(/postgresIntegrationReady/);
    expect(block).toContain("prepareAssistantIntegrationTestDatabase");
  });
});

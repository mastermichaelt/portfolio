import { LegacyAdoptionRequiredError } from "./legacy-baseline.mjs";
import { runMigrations } from "./migrate.mjs";
import { resetAssistantDatabaseForTests } from "./test-database-reset.mjs";

export const LEGACY_ADOPTION_INTEGRATION_TEST_HINT =
  "Dedicated ASSISTANT_TEST_DATABASE_URL integration tests reset the *_test database and apply Drizzle migrations only. " +
  "Use a separate portfolio_assistant_test (or other *_test) database — not the dev/hosted DATABASE_URL. " +
  "One-time legacy adoption (npm run assistant:db:baseline) is operator-only and is never run from tests.";

/**
 * Reset and migrate the validated dedicated test database before integration tests.
 * Destructive to ASSISTANT_TEST_DATABASE_URL only (never DATABASE_URL).
 *
 * @param {import("pg").Pool} pool
 * @param {{ log?: (message: string) => void }} [options]
 */
export async function prepareAssistantIntegrationTestDatabase(
  pool,
  options = {},
) {
  await resetAssistantDatabaseForTests(pool);
  try {
    await runMigrations(pool, options);
  } catch (error) {
    if (error instanceof LegacyAdoptionRequiredError) {
      throw new Error(
        `${error.message}\n${LEGACY_ADOPTION_INTEGRATION_TEST_HINT}`,
      );
    }
    throw error;
  }
}

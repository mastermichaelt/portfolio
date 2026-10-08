import { loadEnvFiles } from "./load-env.mjs";
import { resolveAssistantDatabaseUrl } from "./client.mjs";

/** @typedef {{ ok: true } | { ok: false, reason: string }} ValidationResult */

/**
 * @param {string} databaseUrl
 * @returns {string}
 */
export function parsePostgresDatabaseName(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const pathname = parsed.pathname.replace(/^\//, "");
    const database = pathname.split("/")[0]?.trim();
    if (!database) {
      throw new Error("missing database name in path");
    }
    return decodeURIComponent(database);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid assistant test DATABASE_URL (could not parse database name): ${message}`,
    );
  }
}

/**
 * @param {string} databaseUrl
 * @returns {boolean}
 */
export function isNeonPostgresHost(databaseUrl) {
  try {
    const hostname = new URL(databaseUrl).hostname.toLowerCase();
    return hostname.endsWith(".neon.tech") || hostname.includes(".neon.");
  } catch {
    return false;
  }
}

/**
 * Guards for destructive ingest integration tests (full-corpus sync semantics).
 *
 * @param {string} databaseUrl
 * @returns {ValidationResult}
 */
export function validateAssistantIngestTestDatabaseUrl(databaseUrl) {
  const trimmed = databaseUrl.trim();
  if (!trimmed) {
    return { ok: false, reason: "ASSISTANT_TEST_DATABASE_URL is empty" };
  }

  const devUrl = resolveAssistantDatabaseUrl();
  if (devUrl && trimmed === devUrl) {
    return {
      ok: false,
      reason:
        "ASSISTANT_TEST_DATABASE_URL must not equal DATABASE_URL (use a dedicated test database, e.g. portfolio_assistant_test)",
    };
  }

  let databaseName;
  try {
    databaseName = parsePostgresDatabaseName(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: message };
  }

  if (!databaseName.toLowerCase().endsWith("_test")) {
    return {
      ok: false,
      reason: `assistant ingest integration tests require a database name ending in _test (got "${databaseName}")`,
    };
  }

  if (isNeonPostgresHost(trimmed)) {
    const allowNeon = process.env.ASSISTANT_TEST_ALLOW_NEON?.trim() === "1";
    if (!allowNeon) {
      return {
        ok: false,
        reason:
          "Neon hosts require ASSISTANT_TEST_ALLOW_NEON=1 and a *_test database name for ingest integration tests",
      };
    }
  }

  return { ok: true };
}

/**
 * Destructive ingest integration tests use ASSISTANT_TEST_DATABASE_URL only —
 * never DATABASE_URL (dev or hosted retrieval index).
 *
 * @returns {string | undefined}
 */
export function resolveAssistantIngestTestDatabaseUrl() {
  loadEnvFiles();
  const url = process.env.ASSISTANT_TEST_DATABASE_URL?.trim();
  if (!url) {
    return undefined;
  }

  const validation = validateAssistantIngestTestDatabaseUrl(url);
  if (!validation.ok) {
    throw new Error(`Unsafe ASSISTANT_TEST_DATABASE_URL: ${validation.reason}`);
  }

  return url;
}

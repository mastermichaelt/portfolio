import pg from "pg";

import { loadEnvFiles } from "./load-env.mjs";

/**
 * Load env files and return a trimmed DATABASE_URL when configured.
 *
 * @returns {string | undefined}
 */
export function resolveAssistantDatabaseUrl() {
  loadEnvFiles();
  const url = process.env.DATABASE_URL?.trim();
  return url || undefined;
}

/**
 * @returns {string}
 */
export function getDatabaseUrl() {
  const url = resolveAssistantDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for assistant retrieval tooling (see .env.example and docs/assistant/assistant-database.md)",
    );
  }
  return url;
}

/**
 * @param {string} [databaseUrl]
 * @returns {import("pg").Pool}
 */
export function createPool(databaseUrl = getDatabaseUrl()) {
  return new pg.Pool({ connectionString: databaseUrl });
}

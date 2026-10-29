import { loadEnvFiles } from "./load-env.mjs";

import {
  createAssistantDb as createAssistantDbFromDb,
  createPool as createPoolFromDb,
} from "@/db/client.ts";

/**
 * Load env files and return a trimmed DATABASE_URL when configured.
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
  return createPoolFromDb(databaseUrl);
}

/**
 * @param {import("pg").Pool} pool
 */
export function createAssistantDb(pool) {
  return createAssistantDbFromDb(pool);
}

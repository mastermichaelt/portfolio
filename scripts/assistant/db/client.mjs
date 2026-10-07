import pg from "pg";

/**
 * @returns {string}
 */
export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
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

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { readMigrationFiles } from "drizzle-orm/migrator";

import { countDrizzleJournalRows } from "./drizzle-journal.mjs";
import {
  ASSISTANT_TABLES,
  DRIZZLE_MIGRATIONS_SCHEMA,
  DRIZZLE_MIGRATIONS_TABLE,
  LEGACY_ASSISTANT_MIGRATION_FILES,
  LEGACY_BASELINE_DRIZZLE_TAG,
} from "./migration-meta.mjs";

/** @typedef {{ ok: true } | { ok: false, reason: string }} LegacyBaselineEligibility */

export class LegacyBaselineIneligibleError extends Error {
  /**
   * @param {string} reason
   */
  constructor(reason) {
    super(`Assistant legacy baseline refused: ${reason}`);
    this.name = "LegacyBaselineIneligibleError";
  }
}

export class LegacyBaselineAlreadyAdoptedError extends Error {
  /**
   * @param {string} reason
   */
  constructor(reason) {
    super(`Assistant legacy baseline refused: ${reason}`);
    this.name = "LegacyBaselineAlreadyAdoptedError";
  }
}

export class LegacyAdoptionRequiredError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "LegacyAdoptionRequiredError";
  }
}

/**
 * @param {import("drizzle-orm/migrator").MigrationConfig} migrationConfig
 * @param {import("drizzle-orm/migrator").MigrationMeta[]} [migrationsOverride] test hook
 * @returns {import("drizzle-orm/migrator").MigrationMeta}
 */
export function resolveLegacyBaselineMigration(
  migrationConfig,
  migrationsOverride,
) {
  const migrations = migrationsOverride ?? readMigrationFiles(migrationConfig);
  const journalPath = path.join(
    migrationConfig.migrationsFolder,
    "meta/_journal.json",
  );
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const hasBaselineTag = journal.entries.some(
    (entry) => entry.tag === LEGACY_BASELINE_DRIZZLE_TAG,
  );

  if (!hasBaselineTag) {
    throw new Error(
      `Drizzle journal missing required baseline tag ${LEGACY_BASELINE_DRIZZLE_TAG}`,
    );
  }

  const sqlPath = path.join(
    migrationConfig.migrationsFolder,
    `${LEGACY_BASELINE_DRIZZLE_TAG}.sql`,
  );
  if (!fs.existsSync(sqlPath)) {
    throw new Error(
      `Missing SQL migration file for baseline tag ${LEGACY_BASELINE_DRIZZLE_TAG}`,
    );
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const expectedHash = crypto.createHash("sha256").update(sql).digest("hex");
  const baseline = migrations.find(
    (migration) => migration.hash === expectedHash,
  );

  if (!baseline) {
    throw new Error(
      `No Drizzle migration metadata matches baseline tag ${LEGACY_BASELINE_DRIZZLE_TAG}`,
    );
  }

  return baseline;
}

/**
 * @param {import("drizzle-orm/migrator").MigrationMeta[]} migrations
 * @returns {import("drizzle-orm/migrator").MigrationMeta}
 * @deprecated Prefer resolveLegacyBaselineMigration — kept for unit tests comparing journal tag resolution.
 */
export function selectLegacyBaselineMigration(migrations) {
  if (migrations.length === 0) {
    throw new Error("No Drizzle migration files found to baseline");
  }

  return migrations[0];
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} pool
 * @param {string} tableName
 * @returns {Promise<boolean>}
 */
async function publicTableExists(pool, tableName) {
  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
  `,
    [tableName],
  );
  return result.rows[0]?.exists === true;
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} pool
 * @returns {Promise<boolean>}
 */
export async function hasAnyAssistantTable(pool) {
  for (const tableName of ASSISTANT_TABLES) {
    if (await publicTableExists(pool, tableName)) {
      return true;
    }
  }
  return false;
}

/**
 * Confirm the database matches legacy-runner completion before seeding Drizzle journal rows.
 *
 * @param {import("pg").Pool | import("pg").PoolClient} pool
 * @returns {Promise<LegacyBaselineEligibility>}
 */
export async function assessLegacyBaselineEligibility(pool) {
  const extensionResult = await pool.query(
    "SELECT extname FROM pg_extension WHERE extname = 'vector'",
  );
  if (extensionResult.rows.length !== 1) {
    return {
      ok: false,
      reason: "pgvector extension is not enabled",
    };
  }

  const missingTables = [];
  for (const tableName of ASSISTANT_TABLES) {
    if (!(await publicTableExists(pool, tableName))) {
      missingTables.push(tableName);
    }
  }
  if (missingTables.length > 0) {
    return {
      ok: false,
      reason: `assistant table(s) missing: ${missingTables.join(", ")}`,
    };
  }

  const schemaMigrationsExists = await publicTableExists(
    pool,
    "schema_migrations",
  );
  if (!schemaMigrationsExists) {
    return {
      ok: false,
      reason:
        "schema_migrations table is missing (legacy runner history required before baseline)",
    };
  }

  const migrationResult = await pool.query(
    "SELECT filename FROM schema_migrations WHERE filename = ANY($1::text[])",
    [LEGACY_ASSISTANT_MIGRATION_FILES],
  );
  const recorded = new Set(migrationResult.rows.map((row) => row.filename));
  const missingLegacyFiles = LEGACY_ASSISTANT_MIGRATION_FILES.filter(
    (filename) => !recorded.has(filename),
  );
  if (missingLegacyFiles.length > 0) {
    return {
      ok: false,
      reason: `legacy migration file(s) not recorded in schema_migrations: ${missingLegacyFiles.join(", ")}`,
    };
  }

  return { ok: true };
}

/**
 * @param {import("pg").Pool} pool
 * @param {import("drizzle-orm/migrator").MigrationConfig} migrationConfig
 * @param {(message: string) => void} log
 * @param {import("drizzle-orm/migrator").MigrationMeta[]} [migrationsOverride] test hook
 */
export async function seedLegacyBaselineJournal(
  pool,
  migrationConfig,
  log,
  migrationsOverride,
) {
  const baseline = resolveLegacyBaselineMigration(
    migrationConfig,
    migrationsOverride,
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `CREATE SCHEMA IF NOT EXISTS ${DRIZZLE_MIGRATIONS_SCHEMA}`,
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE}`,
    );
    const existingCount = countResult.rows[0]?.count ?? 0;
    if (existingCount > 0) {
      throw new LegacyBaselineAlreadyAdoptedError(
        `${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} already records ${existingCount} migration(s)`,
      );
    }

    await client.query(
      `INSERT INTO ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} (hash, created_at) VALUES ($1, $2)`,
      [baseline.hash, baseline.folderMillis],
    );
    await client.query("COMMIT");
    log(
      `baselined ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} tag=${LEGACY_BASELINE_DRIZZLE_TAG} hash=${baseline.hash.slice(0, 12)}…`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * One-time adoption of a legacy-runner database into Drizzle journal authority.
 *
 * @param {import("pg").Pool} pool
 * @param {import("drizzle-orm/migrator").MigrationConfig} migrationConfig
 * @param {{ log?: (message: string) => void }} [options]
 */
export async function runLegacyBaselineAdoption(
  pool,
  migrationConfig,
  options = {},
) {
  const log = options.log ?? console.log;
  const journalRows = await countDrizzleJournalRows(pool);
  if (journalRows > 0) {
    throw new LegacyBaselineAlreadyAdoptedError(
      `${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} already has ${journalRows} row(s); baseline is one-time only`,
    );
  }

  const eligibility = await assessLegacyBaselineEligibility(pool);
  if (!eligibility.ok) {
    throw new LegacyBaselineIneligibleError(eligibility.reason);
  }

  await seedLegacyBaselineJournal(pool, migrationConfig, log);
  log("legacy baseline adoption complete");
}

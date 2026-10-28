import {
  DRIZZLE_MIGRATIONS_SCHEMA,
  DRIZZLE_MIGRATIONS_TABLE,
} from "./migration-meta.mjs";

/**
 * @param {import("pg").Pool | import("pg").PoolClient} pool
 * @returns {Promise<number>}
 */
export async function countDrizzleJournalRows(pool) {
  const tableExists = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = $2
    ) AS exists
  `,
    [DRIZZLE_MIGRATIONS_SCHEMA, DRIZZLE_MIGRATIONS_TABLE],
  );

  if (tableExists.rows[0]?.exists !== true) {
    return 0;
  }

  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE}`,
  );
  return result.rows[0]?.count ?? 0;
}

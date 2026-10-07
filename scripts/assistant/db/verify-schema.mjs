/** @typedef {{ name: string, ok: boolean, detail: string }} SchemaCheck */

export const ASSISTANT_PGVECTOR_MIGRATION =
  "20261007100000_assistant_pgvector.sql";

export const EXPECTED_EMBEDDING_DIMENSIONS = 1536;

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @returns {Promise<SchemaCheck[]>}
 */
export async function verifyAssistantSchema(db) {
  const checks = [];

  const extensionResult = await db.query(
    "SELECT extname FROM pg_extension WHERE extname = 'vector'",
  );
  checks.push({
    name: "vector_extension",
    ok: extensionResult.rows.length === 1,
    detail:
      extensionResult.rows.length === 1
        ? "pgvector extension is enabled"
        : "pgvector extension is missing",
  });

  const migrationResult = await db.query(
    "SELECT filename FROM schema_migrations WHERE filename = $1",
    [ASSISTANT_PGVECTOR_MIGRATION],
  );
  checks.push({
    name: "assistant_pgvector_migration",
    ok: migrationResult.rows.length === 1,
    detail:
      migrationResult.rows.length === 1
        ? `${ASSISTANT_PGVECTOR_MIGRATION} is recorded in schema_migrations`
        : `${ASSISTANT_PGVECTOR_MIGRATION} has not been applied`,
  });

  const tableResult = await db.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'assistant_retrieval_units'
    ) AS exists
  `,
  );
  const tableExists = tableResult.rows[0]?.exists === true;
  checks.push({
    name: "assistant_retrieval_units_table",
    ok: tableExists,
    detail: tableExists
      ? "assistant_retrieval_units table exists"
      : "assistant_retrieval_units table is missing",
  });

  if (tableExists) {
    const embeddingTypeResult = await db.query(
      `
      SELECT format_type(a.atttypid, a.atttypmod) AS embedding_type
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND c.relname = 'assistant_retrieval_units'
        AND a.attname = 'embedding'
        AND NOT a.attisdropped
    `,
    );
    const embeddingType =
      embeddingTypeResult.rows[0]?.embedding_type ?? "missing";
    const expectedType = `vector(${EXPECTED_EMBEDDING_DIMENSIONS})`;
    checks.push({
      name: "embedding_vector_dimension",
      ok: embeddingType === expectedType,
      detail:
        embeddingType === expectedType
          ? `embedding column is ${expectedType}`
          : `expected embedding column ${expectedType}, found ${embeddingType}`,
    });

    const indexResult = await db.query(
      `
      SELECT indexdef
      FROM pg_indexes
      WHERE tablename = 'assistant_retrieval_units'
    `,
    );
    const hasAnnIndex = indexResult.rows.some((row) =>
      /hnsw|ivfflat/i.test(row.indexdef),
    );
    checks.push({
      name: "no_ann_vector_index",
      ok: !hasAnnIndex,
      detail: hasAnnIndex
        ? "ANN vector index detected; experiment uses exact search only"
        : "no ANN vector index on assistant_retrieval_units",
    });
  }

  return checks;
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @returns {Promise<SchemaCheck>}
 */
export async function verifyAssistantConnectivity(db) {
  const result = await db.query("SELECT 1 AS ok");
  const connected = result.rows[0]?.ok === 1;
  return {
    name: "connectivity",
    ok: connected,
    detail: connected
      ? "database connection succeeded"
      : "database connection check failed",
  };
}

/**
 * @param {SchemaCheck[]} checks
 * @returns {{ ok: boolean, checks: SchemaCheck[] }}
 */
export function summarizeSchemaChecks(checks) {
  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

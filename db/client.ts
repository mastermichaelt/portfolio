import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

/**
 * @param connectionString Postgres URL (`DATABASE_URL` for assistant scope).
 */
export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString });
}

export function createAssistantDb(pool: pg.Pool) {
  return drizzle(pool, { schema });
}

export type AssistantDb = ReturnType<typeof createAssistantDb>;

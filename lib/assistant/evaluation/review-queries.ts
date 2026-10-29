import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { Pool } from "pg";

import { createAssistantDb } from "@/db/client";
import { assistantGenerationEvaluations } from "@/db/schema";

export async function listRecentEvaluations(pool: Pool, limit = 20) {
  const db = createAssistantDb(pool);
  return db
    .select({
      id: assistantGenerationEvaluations.id,
      createdAt: assistantGenerationEvaluations.createdAt,
      status: assistantGenerationEvaluations.status,
      question: assistantGenerationEvaluations.question,
      supportLevel: assistantGenerationEvaluations.supportLevel,
      abstained: assistantGenerationEvaluations.abstained,
    })
    .from(assistantGenerationEvaluations)
    .orderBy(desc(assistantGenerationEvaluations.createdAt))
    .limit(limit);
}

export async function listEvaluationsByStatus(
  pool: Pool,
  status: string,
  limit = 50,
) {
  const db = createAssistantDb(pool);
  return db
    .select({
      id: assistantGenerationEvaluations.id,
      createdAt: assistantGenerationEvaluations.createdAt,
      status: assistantGenerationEvaluations.status,
      question: assistantGenerationEvaluations.question,
      supportLevel: assistantGenerationEvaluations.supportLevel,
      failureCategory: assistantGenerationEvaluations.failureCategory,
    })
    .from(assistantGenerationEvaluations)
    .where(eq(assistantGenerationEvaluations.status, status))
    .orderBy(desc(assistantGenerationEvaluations.createdAt))
    .limit(limit);
}

export async function listWeaklySupportedEvaluations(pool: Pool, limit = 50) {
  const db = createAssistantDb(pool);
  return db
    .select({
      id: assistantGenerationEvaluations.id,
      createdAt: assistantGenerationEvaluations.createdAt,
      status: assistantGenerationEvaluations.status,
      question: assistantGenerationEvaluations.question,
      supportLevel: assistantGenerationEvaluations.supportLevel,
    })
    .from(assistantGenerationEvaluations)
    .where(
      and(
        eq(assistantGenerationEvaluations.status, "completed"),
        inArray(assistantGenerationEvaluations.supportLevel, [
          "partial",
          "none",
        ]),
      ),
    )
    .orderBy(desc(assistantGenerationEvaluations.createdAt))
    .limit(limit);
}

export async function getEvaluationById(pool: Pool, id: string) {
  const db = createAssistantDb(pool);
  const rows = await db
    .select()
    .from(assistantGenerationEvaluations)
    .where(eq(assistantGenerationEvaluations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function countEvaluationsBySupportLevel(pool: Pool) {
  const db = createAssistantDb(pool);
  return db
    .select({
      supportLevel: assistantGenerationEvaluations.supportLevel,
      count: sql<number>`count(*)::int`,
    })
    .from(assistantGenerationEvaluations)
    .groupBy(assistantGenerationEvaluations.supportLevel)
    .orderBy(desc(sql`count(*)`));
}

export async function deleteEvaluationsOlderThan(pool: Pool, cutoff: Date) {
  const db = createAssistantDb(pool);
  const deleted = await db
    .delete(assistantGenerationEvaluations)
    .where(lt(assistantGenerationEvaluations.createdAt, cutoff))
    .returning({ id: assistantGenerationEvaluations.id });
  return deleted.length;
}

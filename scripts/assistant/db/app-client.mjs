/**
 * Typed Drizzle factory for application query paths (ingest, retrieve, generation).
 * Requires Node `--experimental-strip-types` and `register-tsconfig-paths.mjs` — not for migrate/verify/baseline.
 */
export { createAssistantDb } from "@/db/client.ts";

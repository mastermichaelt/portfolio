import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  createPool,
  resolveAssistantDatabaseUrl,
} from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const operationalDatabaseUrl = resolveAssistantDatabaseUrl();
const hasOperationalDatabase = Boolean(operationalDatabaseUrl);

let assistantTestDatabaseUrl: string | undefined;
try {
  assistantTestDatabaseUrl = resolveAssistantIngestTestDatabaseUrl();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Misconfigured ASSISTANT_TEST_DATABASE_URL for assistant db CLI tests: ${message}`,
  );
}
const hasAssistantTestDatabase = Boolean(assistantTestDatabaseUrl);

function importUnderPlainNode(relativeModulePath: string) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import ${JSON.stringify(relativeModulePath)}`,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          operationalDatabaseUrl ??
          "postgresql://portfolio:portfolio_dev@127.0.0.1:5433/portfolio_assistant",
      },
    },
  );
}

function runNpmScript(
  script: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = process.env,
) {
  return spawnSync("npm", ["run", "-s", script, "--", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env,
  });
}

describe("assistant db CLI modules (plain Node)", () => {
  it("loads client.mjs without TypeScript path aliases", () => {
    const result = importUnderPlainNode("./scripts/assistant/db/client.mjs");
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it("loads baseline.mjs without TypeScript path aliases", () => {
    const result = importUnderPlainNode("./scripts/assistant/db/baseline.mjs");
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });
});

describe("assistant db operational npm scripts", () => {
  it("runs assistant:db:verify --help under plain Node npm wiring", () => {
    const result = runNpmScript("assistant:db:verify", ["--help"]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toMatch(/assistant:db:verify/);
  });

  describe.skipIf(!hasOperationalDatabase)(
    "read-only verify (DATABASE_URL)",
    () => {
      it("runs assistant:db:verify --json via npm script", () => {
        const result = runNpmScript("assistant:db:verify", ["--json"]);
        expect(result.status, result.stderr || result.stdout).toBe(0);

        const summary = JSON.parse(result.stdout) as { ok?: boolean };
        expect(summary.ok).toBe(true);
      });

      it("opens a pool via client.mjs createPool", async () => {
        const pool = createPool(operationalDatabaseUrl!);
        try {
          const result = await pool.query("SELECT 1 AS ok");
          expect(result.rows[0]?.ok).toBe(1);
        } finally {
          await pool.end();
        }
      });
    },
  );

  describe.skipIf(!hasAssistantTestDatabase)(
    "mutating migrate (ASSISTANT_TEST_DATABASE_URL only)",
    () => {
      it("runs assistant:db:migrate via npm script against the disposable test database", () => {
        const result = runNpmScript("assistant:db:migrate", [], {
          ...process.env,
          DATABASE_URL: assistantTestDatabaseUrl!,
        });
        expect(result.status, result.stderr || result.stdout).toBe(0);
        expect(result.stdout).toContain("drizzle migrate complete");
      });
    },
  );
});

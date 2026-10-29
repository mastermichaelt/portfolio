import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

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
          process.env.DATABASE_URL ??
          "postgresql://portfolio:portfolio_dev@127.0.0.1:5433/portfolio_assistant",
      },
    },
  );
}

describe("assistant db CLI modules (plain Node)", () => {
  it("loads client.mjs without TypeScript path aliases", () => {
    const result = importUnderPlainNode("./scripts/assistant/db/client.mjs");
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it("loads migrate.mjs without TypeScript path aliases", () => {
    const result = importUnderPlainNode("./scripts/assistant/db/migrate.mjs");
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it("loads verify.mjs without TypeScript path aliases", () => {
    const result = importUnderPlainNode("./scripts/assistant/db/verify.mjs");
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it("loads baseline.mjs without TypeScript path aliases", () => {
    const result = importUnderPlainNode("./scripts/assistant/db/baseline.mjs");
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });
});

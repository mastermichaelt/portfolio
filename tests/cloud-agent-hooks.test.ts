import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd());
const ensureGitHooksHook = join(repoRoot, ".cursor/hooks/ensure-git-hooks.sh");
const ensureHooks = join(repoRoot, "scripts/ensure-hooks.sh");
const prepareGitHooks = join(repoRoot, "scripts/prepare-git-hooks.sh");
const verifyGitHooks = join(repoRoot, "scripts/verify-git-hooks.sh");
const huskyShimRepair = join(repoRoot, "scripts/husky-shim-repair.sh");

function expectExecutable(path: string): void {
  const mode = statSync(path).mode;
  expect(
    mode & 0o111,
    `${path} must be executable for Cursor command hooks`,
  ).toBeTruthy();
}

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  mkdirSync(join(repoRoot, ".tmp-hook-tests"), { recursive: true });
  const dir = mkdtempSync(join(repoRoot, ".tmp-hook-tests", prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function envWithoutGit(
  overrides: Record<string, string | undefined>,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CURSOR_AGENT_SOCKET: "/nonexistent/cursor-agent.sock",
    ...overrides,
  };
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  delete env.GIT_COMMON_DIR;
  return env;
}

describe("Cursor command hooks", () => {
  it("keeps hook scripts executable (Cursor requires +x + shebang)", () => {
    expectExecutable(ensureGitHooksHook);
    expectExecutable(ensureHooks);
    expectExecutable(prepareGitHooks);
    expectExecutable(verifyGitHooks);
    expectExecutable(huskyShimRepair);
  });
});

describe("sessionStart ensure-git-hooks hook", () => {
  it("exits 0 and chains when agent-hooks appear after prepare", () => {
    const home = makeTempDir("home-");
    const work = makeTempDir("repo-");
    const agentHooks = join(home, ".cursor", "agent-hooks", "test-id");
    mkdirSync(agentHooks, { recursive: true });
    writeFileSync(join(agentHooks, ".dispatcher"), "#!/bin/sh\n");
    chmodSync(join(agentHooks, ".dispatcher"), 0o755);

    mkdirSync(join(work, ".husky", "_"), { recursive: true });
    writeFileSync(join(work, ".husky", "pre-commit"), "#!/bin/sh\n");
    mkdirSync(join(work, "scripts"), { recursive: true });
    writeFileSync(
      join(work, "scripts", "ensure-hooks.sh"),
      readFileSync(ensureHooks),
    );

    const gitInit = spawnSync("git", ["init"], { cwd: work, encoding: "utf8" });
    expect(gitInit.status).toBe(0);
    spawnSync("git", ["-C", work, "config", "core.hooksPath", ".husky/_"], {
      encoding: "utf8",
    });

    const result = spawnSync("sh", [ensureGitHooksHook], {
      cwd: work,
      encoding: "utf8",
      env: envWithoutGit({ HOME: home }),
    });
    expect(result.status).toBe(0);

    const hooksPath = spawnSync(
      "git",
      ["-C", work, "config", "--get", "core.hooksPath"],
      {
        encoding: "utf8",
      },
    );
    expect(hooksPath.stdout.trim()).toBe(agentHooks);
    expect(
      readFileSync(
        join(agentHooks, ".cursor-original-hooks-path"),
        "utf8",
      ).trim(),
    ).toBe(join(home, ".cursor", "husky-bridge"));
  });
});

describe("ensure-hooks.sh", () => {
  it("no-ops when Cursor agent-hooks are absent", () => {
    const home = makeTempDir("home-");
    const work = makeTempDir("repo-");
    mkdirSync(join(work, ".husky"), { recursive: true });
    writeFileSync(join(work, ".husky", "pre-commit"), "#!/bin/sh\n");

    const gitInit = spawnSync("git", ["init"], { cwd: work, encoding: "utf8" });
    expect(gitInit.status).toBe(0);
    spawnSync("git", ["-C", work, "config", "core.hooksPath", ".husky/_"], {
      encoding: "utf8",
    });

    const result = spawnSync("sh", [ensureHooks], {
      cwd: work,
      encoding: "utf8",
      env: envWithoutGit({ HOME: home }),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("chains Cursor agent-hooks to Husky", () => {
    const home = makeTempDir("home-");
    const work = makeTempDir("repo-");
    const agentHooks = join(home, ".cursor", "agent-hooks", "test-id");
    mkdirSync(agentHooks, { recursive: true });
    writeFileSync(join(agentHooks, ".dispatcher"), "#!/bin/sh\n");
    chmodSync(join(agentHooks, ".dispatcher"), 0o755);

    mkdirSync(join(work, ".husky", "_"), { recursive: true });
    writeFileSync(join(work, ".husky", "pre-commit"), "#!/bin/sh\n");

    const gitInit = spawnSync("git", ["init"], { cwd: work, encoding: "utf8" });
    expect(gitInit.status).toBe(0);

    spawnSync("git", ["-C", work, "config", "core.hooksPath", ".husky/_"], {
      encoding: "utf8",
    });

    const result = spawnSync("sh", [ensureHooks], {
      cwd: work,
      encoding: "utf8",
      env: envWithoutGit({ HOME: home }),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Restored core.hooksPath");
    expect(result.stdout).toContain("Updated original hooks path");
    expect(result.stdout).toContain("Created pre-commit hook symlink");

    const hooksPath = spawnSync(
      "git",
      ["-C", work, "config", "--get", "core.hooksPath"],
      {
        encoding: "utf8",
      },
    );
    const bridgeDir = join(home, ".cursor", "husky-bridge");
    expect(hooksPath.stdout.trim()).toBe(agentHooks);
    expect(
      readFileSync(
        join(agentHooks, ".cursor-original-hooks-path"),
        "utf8",
      ).trim(),
    ).toBe(bridgeDir);
  });

  it("exits 0 outside a Git worktree", () => {
    const dir = mkdtempSync(join(tmpdir(), "ensure-hooks-no-git-"));
    tempDirs.push(dir);
    const result = spawnSync("sh", [ensureHooks], {
      cwd: dir,
      encoding: "utf8",
      env: envWithoutGit({ HOME: dir }),
    });
    expect(result.status).toBe(0);
  });
});

describe("prepare-git-hooks.sh", () => {
  it("skips husky on Vercel", () => {
    const home = makeTempDir("home-");
    const result = spawnSync("sh", [prepareGitHooks], {
      cwd: repoRoot,
      encoding: "utf8",
      env: envWithoutGit({ HOME: home, VERCEL: "1", HUSKY: "" }),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Skipping husky install (CI)");
  });

  it("skips husky when CI is set and Cursor Cloud is not detected", () => {
    const home = makeTempDir("home-");
    const result = spawnSync("sh", [prepareGitHooks], {
      cwd: repoRoot,
      encoding: "utf8",
      env: envWithoutGit({
        HOME: home,
        CI: "true",
        VERCEL: "",
        GITHUB_ACTIONS: "",
        HUSKY: "",
      }),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Skipping husky install (CI)");
  });

  it("exits 0 outside a Git worktree", () => {
    const dir = mkdtempSync(join(tmpdir(), "prepare-hooks-no-git-"));
    tempDirs.push(dir);
    const result = spawnSync("sh", [prepareGitHooks], {
      cwd: dir,
      encoding: "utf8",
      env: envWithoutGit({
        HOME: dir,
        CI: "true",
        VERCEL: "",
        GITHUB_ACTIONS: "",
        HUSKY: "",
      }),
    });
    expect(result.status).toBe(0);
  });
});

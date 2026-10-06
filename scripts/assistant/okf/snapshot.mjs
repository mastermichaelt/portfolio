#!/usr/bin/env node
/**
 * Fixture acquisition helper — copies pinned inputs from sibling checkouts.
 * Not part of deterministic okf:build. Run only when deliberately refreshing fixtures.
 *
 * Usage:
 *   npm run okf:snapshot
 *   npm run okf:snapshot -- --renovate-workflow /path/to/renovate-workflow.md
 *   npm run okf:snapshot -- --renovate-commit <sha>   # upstream renovate-workflow commit for origin_commit
 *   npm run okf:snapshot -- --dev-article /path/to/evidence-driven-dependency-upgrades.md
 *
 * Pass --renovate-commit explicitly when refreshing the repo runbook fixture so
 * assistant-corpus/fixtures/manifest.json records the exact upstream SHA. The
 * snapshot command does not infer a commit from git automatically.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  DEV_ARTICLE_URL,
  FIXTURE_FILES,
  FIXTURES_DIR,
  REPO_RUNBOOK_RESOURCE,
} from "./constants.mjs";
import { writeJson } from "./manifest.mjs";

const DEFAULT_SIBLING_PATHS = {
  renovateWorkflow: "../../renovate-workflow/docs/renovate-workflow.md",
  devArticle:
    "../../editorial-workflow/docs/dev.to/published/evidence-driven-dependency-upgrades.md",
};

function sha256File(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--renovate-workflow") {
      options.renovateWorkflow = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--renovate-commit") {
      options.renovateCommit = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--dev-article") {
      options.devArticle = argv[i + 1];
      i += 1;
    }
  }
  return options;
}

function resolveSource(explicitPath, siblingRelative) {
  if (explicitPath) return path.resolve(explicitPath);
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    siblingRelative,
  );
}

function copyFixture({ sourcePath, destName, record }) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Fixture source not found: ${sourcePath}`);
  }
  const destPath = path.join(FIXTURES_DIR, destName);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(sourcePath, destPath);
  record.sha256 = sha256File(destPath);
  record.acquired_at = new Date().toISOString();
  record.local_path = destPath;
}

export function snapshotFixtures(options = {}) {
  const renovateSource = resolveSource(
    options.renovateWorkflow,
    DEFAULT_SIBLING_PATHS.renovateWorkflow,
  );
  const devSource = resolveSource(
    options.devArticle,
    DEFAULT_SIBLING_PATHS.devArticle,
  );

  const manifest = {
    description:
      "Acquisition record for pinned OKF normalization inputs. Refresh with npm run okf:snapshot.",
    fixtures: {
      [FIXTURE_FILES.renovateWorkflow]: {
        origin: REPO_RUNBOOK_RESOURCE,
        origin_commit: options.renovateCommit ?? null,
        source_path: renovateSource,
      },
      [FIXTURE_FILES.evidenceDrivenUpgrades]: {
        origin: DEV_ARTICLE_URL,
        devto_article_id: "4056883",
        source_path: devSource,
      },
    },
  };

  copyFixture({
    sourcePath: renovateSource,
    destName: FIXTURE_FILES.renovateWorkflow,
    record: manifest.fixtures[FIXTURE_FILES.renovateWorkflow],
  });
  copyFixture({
    sourcePath: devSource,
    destName: FIXTURE_FILES.evidenceDrivenUpgrades,
    record: manifest.fixtures[FIXTURE_FILES.evidenceDrivenUpgrades],
  });

  writeJson(path.join(FIXTURES_DIR, "manifest.json"), manifest);
  return manifest;
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const manifest = snapshotFixtures(options);
  console.log(`Fixture snapshot written to ${FIXTURES_DIR}/manifest.json`);
  for (const [name, record] of Object.entries(manifest.fixtures)) {
    console.log(`  ${name}: sha256=${record.sha256}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

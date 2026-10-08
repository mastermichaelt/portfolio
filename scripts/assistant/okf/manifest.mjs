import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  CORPUS_ROOT,
  FIXTURE_FILES,
  FIXTURES_DIR,
  OKF_VERSION,
} from "./constants.mjs";

export function sha256File(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function sha256String(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function buildFixtureInputs(fixtureRoot = FIXTURES_DIR) {
  const fixtures = {};
  const absoluteRoot = path.isAbsolute(fixtureRoot)
    ? fixtureRoot
    : path.join(process.cwd(), fixtureRoot);

  for (const fileName of Object.values(FIXTURE_FILES)) {
    const absolutePath = path.join(absoluteRoot, fileName);
    fixtures[fileName] = {
      path: path.relative(process.cwd(), absolutePath),
      sha256: sha256File(absolutePath),
    };
  }
  return fixtures;
}

export function listConceptFiles(corpusRoot = CORPUS_ROOT) {
  const concepts = [];
  for (const dir of [
    "portfolio",
    "repo",
    "writing",
    "about",
    "career",
    "tooling",
  ]) {
    const absoluteDir = path.join(corpusRoot, dir);
    if (!fs.existsSync(absoluteDir)) continue;
    for (const file of fs.readdirSync(absoluteDir).sort()) {
      if (file.endsWith(".md")) {
        concepts.push(path.join(dir, file));
      }
    }
  }
  return concepts;
}

export function buildNormalizationManifest({
  corpusRoot = CORPUS_ROOT,
  fixtureRoot = FIXTURES_DIR,
  conceptPaths,
  generatedAt,
}) {
  const outputs = conceptPaths.map((relativePath) => {
    const absolutePath = path.join(corpusRoot, relativePath);
    const content = fs.readFileSync(absolutePath, "utf8");
    return {
      path: relativePath,
      sha256: sha256String(content),
    };
  });

  return {
    okf_version: OKF_VERSION,
    generated_at: generatedAt,
    generated_by: "process:portfolio-okf-producer",
    inputs: {
      portfolio: {
        kind: "in-repo content modules",
        paths: [
          "content/supporting-cases.ts",
          "content/articles.ts",
          "content/project-cases.ts",
          "content/ecosystem.ts",
        ],
      },
      about: {
        kind: "in-repo content modules",
        paths: ["content/about.ts"],
      },
      writing: {
        kind: "pinned DEV article fixtures",
        paths: ["tests/fixtures/assistant-okf/published/*.md"],
      },
      career_inventory: {
        kind: "reviewed career inventory snapshots",
        paths: [
          "tests/fixtures/assistant-okf/career-inventory/source-eligibility.json",
          "tests/fixtures/assistant-okf/career-inventory/publication-manifest.json",
          "tests/fixtures/assistant-okf/career-inventory/snapshots/*.md",
        ],
      },
      marketplace_public_docs: {
        kind: "pinned cursor-team-marketplace public documentation",
        paths: [
          "tests/fixtures/assistant-okf/marketplace-public-docs/publication-manifest.json",
          "tests/fixtures/assistant-okf/marketplace-public-docs/snapshots/*.md",
        ],
      },
      savepoints_public_notes: {
        kind: "reviewed Savepoints architecture excerpt",
        paths: [
          "tests/fixtures/assistant-okf/savepoints-public-notes/publication-manifest.json",
          "tests/fixtures/assistant-okf/savepoints-public-notes/snapshots/*.md",
        ],
      },
      fixtures: buildFixtureInputs(fixtureRoot),
    },
    outputs: {
      index: "index.md",
      concept_count: outputs.length,
      concepts: outputs,
      bundle_sha256: sha256String(
        outputs.map((entry) => `${entry.path}:${entry.sha256}`).join("\n"),
      ),
    },
  };
}

export function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

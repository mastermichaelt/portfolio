import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { CORPUS_ROOT, FIXTURES_DIR, OKF_VERSION } from "./constants.mjs";

export function sha256File(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function sha256String(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function readFixtureManifest(fixtureRoot = FIXTURES_DIR) {
  const manifestPath = path.join(fixtureRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Fixture manifest missing: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

export function listConceptFiles(corpusRoot = CORPUS_ROOT) {
  const concepts = [];
  for (const dir of ["portfolio", "repo", "writing"]) {
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
  const fixtureManifest = readFixtureManifest(fixtureRoot);
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
        paths: ["content/supporting-cases.ts", "content/articles.ts"],
      },
      fixtures: fixtureManifest.fixtures,
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

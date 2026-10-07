#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  CORPUS_ROOT,
  EXPERIMENT_FINDINGS_DOC,
  FIXTURES_DIR,
  OKF_VERSION,
} from "./constants.mjs";
import { produceAboutConcepts } from "./about-producer.mjs";
import { produceDevConcepts } from "./dev-producer.mjs";
import { buildNormalizationManifest, writeJson } from "./manifest.mjs";
import { producePortfolioConcepts } from "./portfolio-producer.mjs";
import { produceProjectCaseConcepts } from "./project-case-producer.mjs";
import { produceRepoConcepts } from "./repo-producer.mjs";
import { cleanGeneratedConcepts, writeConcepts } from "./writer.mjs";

function renderIndex(conceptPaths) {
  const grouped = {
    portfolio: conceptPaths.filter((entry) => entry.startsWith("portfolio/")),
    repo: conceptPaths.filter((entry) => entry.startsWith("repo/")),
    writing: conceptPaths.filter((entry) => entry.startsWith("writing/")),
    about: conceptPaths.filter((entry) => entry.startsWith("about/")),
  };

  const section = (title, paths) => {
    const items = paths
      .map((entry) => `- [${path.basename(entry, ".md")}](/${entry})`)
      .join("\n");
    return `## ${title}\n\n${items}`;
  };

  return `---
okf_version: "${OKF_VERSION}"
title: Portfolio assistant OKF corpus (experiment)
generated:
  by: process:portfolio-okf-producer
---

# Portfolio assistant OKF corpus

Normalization experiment bundle across portfolio content, About career record, a pinned repo runbook, and a pinned DEV field report.

${section("Portfolio concepts", grouped.portfolio)}

${section("About concepts", grouped.about)}

${section("Repository concepts", grouped.repo)}

${section("Published writing concepts", grouped.writing)}

Experiment findings: \`${EXPERIMENT_FINDINGS_DOC}\` (durable; generated output is ephemeral).
`;
}

function formatGeneratedCorpus(corpusRoot) {
  const targets = [
    path.join(corpusRoot, "index.md"),
    path.join(corpusRoot, "portfolio"),
    path.join(corpusRoot, "about"),
    path.join(corpusRoot, "repo"),
    path.join(corpusRoot, "writing"),
  ];
  execSync(
    `npx prettier --write ${targets.map((entry) => JSON.stringify(entry)).join(" ")}`,
    {
      stdio: "inherit",
    },
  );
}

export function buildOkfCorpus({
  corpusRoot = CORPUS_ROOT,
  generatedAt = new Date().toISOString(),
  format = true,
} = {}) {
  cleanGeneratedConcepts(corpusRoot);

  const concepts = [
    ...producePortfolioConcepts(),
    ...produceProjectCaseConcepts(),
    ...produceAboutConcepts(),
    ...produceRepoConcepts(FIXTURES_DIR),
    ...produceDevConcepts(FIXTURES_DIR),
  ];

  const conceptPaths = writeConcepts(corpusRoot, concepts).sort();
  const indexPath = path.join(corpusRoot, "index.md");
  fs.writeFileSync(indexPath, renderIndex(conceptPaths), "utf8");
  if (format) {
    formatGeneratedCorpus(corpusRoot);
  }

  const manifest = buildNormalizationManifest({
    corpusRoot,
    fixtureRoot: FIXTURES_DIR,
    conceptPaths,
    generatedAt,
  });
  const manifestPath = path.join(corpusRoot, "manifest.json");
  writeJson(manifestPath, manifest);
  if (format) {
    execSync(`npx prettier --write ${JSON.stringify(manifestPath)}`, {
      stdio: "inherit",
    });
  }

  return {
    conceptCount: conceptPaths.length,
    conceptPaths,
    manifest,
  };
}

export function main() {
  const result = buildOkfCorpus();
  console.log(
    `OKF build complete: ${result.conceptCount} concepts written to ${CORPUS_ROOT}/`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

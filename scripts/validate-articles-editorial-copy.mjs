#!/usr/bin/env node
/**
 * CI/local gate: /articles inventory editorial copy (summaries, line-lead
 * arguments, band label/note; pairs compound-only). Exits 1 on any failure.
 * See scripts/lib/articles-editorial-copy-validation.mjs
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { articles } from "../content/articles.ts";
import { articleLines } from "../content/article-lines.ts";
import { validateArticlesEditorialCopy } from "./lib/articles-editorial-copy-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = resolve(root, "tests/fixtures/assistant-okf/published");

const { ok, errors } = validateArticlesEditorialCopy(articles, articleLines, {
  fixturesDir,
});

if (!ok) {
  console.error("verify:articles-editorial-copy failed:\n");
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log("verify:articles-editorial-copy OK");

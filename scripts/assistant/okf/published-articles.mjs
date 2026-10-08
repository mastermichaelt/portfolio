import fs from "node:fs";
import path from "node:path";

import { articles } from "../../../content/articles.ts";

import { FIXTURES_DIR } from "./constants.mjs";

/** Portfolio article slug → editorial-hub filename (sync provenance only). */
export const PUBLISHED_ARTICLE_HUB_FILES = {
  "cloud-agent-felt-like-hiring":
    "the-first-cloud-agent-felt-less-like-pair-programming-and-more-like-hiring-an-engineer.md",
  "model-experiments-architectural-stress-test":
    "model-experiments-became-an-architectural-stress-test.md",
  "evidence-driven-dependency-upgrades":
    "evidence-driven-dependency-upgrades.md",
  "reviewers-analysis-before-scoring": "reviewers-analysis-before-scoring.md",
  "ai-reviewer-kinds-of-reasoning":
    "my-ai-reviewer-improved-by-separating-kinds-of-reasoning-not-expanding-its-rubric.md",
  "agent-plans-authority-handoffs": "agent-plans-authority-handoffs.md",
  "active-players-which-sessions-counted":
    "active-players-looked-real-until-we-asked-which-sessions-counted.md",
  "one-example-beats-style-guide": "one-example-beats-style-guide.md",
  "schema-first-valid-json-wasnt-enough":
    "schema-first-valid-json-wasnt-enough.md",
  "experiment-repos-need-first-class-retirement-semantics":
    "experiment-repos-need-first-class-retirement-semantics.md",
  "persist-game-state-not-ephemeral-ui-intent":
    "persist-game-state-not-ephemeral-ui-intent.md",
  "agent-portability-does-not-require-centralizing-methodology-behind-mcp":
    "agent-portability-does-not-require-centralizing-methodology-behind-mcp.md",
  "ai-workflows-need-a-requirements-qa-stage":
    "ai-workflows-need-a-requirements-qa-stage.md",
  "ai-changed-the-build-vs-buy-threshold":
    "ai-changed-the-build-vs-buy-threshold.md",
  "skills-should-own-capabilities-not-individual-actions":
    "skills-should-own-capabilities-not-individual-actions.md",
};

export const PUBLISHED_ARTICLES_DIR = path.join(FIXTURES_DIR, "published");

/** Fixture path for a portfolio articles.ts slug. */
export function publishedArticleFixturePath(slug) {
  return path.join(PUBLISHED_ARTICLES_DIR, `${slug}.md`);
}

/**
 * Every portfolio article row must have a pinned published-body fixture on disk.
 * Does not compare fixture bytes to the editorial hub or live DEV — staleness is an operator follow-up.
 */
export function assertPublishedArticleFixtureCoverage() {
  const slugs = articles.map((entry) => entry.slug).sort();
  const fixtureSlugs = Object.keys(PUBLISHED_ARTICLE_HUB_FILES).sort();
  if (slugs.join("\n") !== fixtureSlugs.join("\n")) {
    throw new Error(
      "articles.ts slugs and PUBLISHED_ARTICLE_HUB_FILES are out of sync",
    );
  }
  for (const slug of slugs) {
    const fixturePath = publishedArticleFixturePath(slug);
    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Missing published article fixture: ${fixturePath}`);
    }
  }
}

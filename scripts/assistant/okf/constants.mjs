/** OKF experiment constants shared by producers and tests. */

export const OKF_VERSION = "0.2";
export const GENERATED_BY = "process:portfolio-okf-producer";
export const SITE_URL = "https://michaeltruong.ai";

/** Ephemeral OKF bundle output (gitignored under /generated/). */
export const CORPUS_ROOT = "generated/okf";

/** Representative external-source inputs for deterministic producer tests. */
export const FIXTURES_DIR = "tests/fixtures/assistant-okf";

export const FIXTURE_FILES = {
  renovateWorkflow: "renovate-workflow.md",
};

export const REPO_RUNBOOK_RESOURCE =
  "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md";

export const CURSOR_TEAM_MARKETPLACE_REPO =
  "multipliers-dev/cursor-team-marketplace";

export const SAVEPOINTS_REPO = "multipliers-dev/savepoints";

export const CODENAMES_REPO = "multipliers-dev/codenames-ai-guesser";

/** Visitor-facing link to a pinned upstream markdown file on GitHub. */
export function marketplaceUpstreamResource(upstreamPath) {
  return `https://github.com/${CURSOR_TEAM_MARKETPLACE_REPO}/blob/main/${upstreamPath}`;
}

/** Visitor-facing link to Savepoints upstream architecture note on GitHub. */
export function savepointsUpstreamResource(upstreamPath) {
  return `https://github.com/${SAVEPOINTS_REPO}/blob/main/${upstreamPath}`;
}

/** Visitor-facing link to Codenames AI upstream engineering doc on GitHub. */
export function codenamesUpstreamResource(upstreamPath) {
  return `https://github.com/${CODENAMES_REPO}/blob/main/${upstreamPath}`;
}

export const EXPERIMENT_FINDINGS_DOC =
  "docs/assistant/okf-normalization-experiment.md";

/** In-repo content modules consumed by OKF producers (manifest metadata). */
export const PORTFOLIO_CONTENT_PATHS = [
  "content/supporting-cases.ts",
  "content/articles.ts",
  "content/project-cases.ts",
  "content/ecosystem.ts",
];

export const ABOUT_CONTENT_PATHS = ["content/about.ts"];

export const PUBLISHED_WRITING_FIXTURES_DIR =
  "tests/fixtures/assistant-okf/published";

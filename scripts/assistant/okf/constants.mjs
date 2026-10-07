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
  evidenceDrivenUpgrades: "evidence-driven-dependency-upgrades.md",
};

export const DEV_ARTICLE_URL =
  "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj";

export const REPO_RUNBOOK_RESOURCE =
  "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md";

export const EXPERIMENT_FINDINGS_DOC =
  "docs/assistant/okf-normalization-experiment.md";

/** In-repo content modules consumed by OKF producers (manifest metadata). */
export const PORTFOLIO_CONTENT_PATHS = [
  "content/supporting-cases.ts",
  "content/articles.ts",
  "content/project-cases.ts",
];

export const ABOUT_CONTENT_PATHS = ["content/about.ts"];

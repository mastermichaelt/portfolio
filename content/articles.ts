import type { Article } from "@/domain/article";

/**
 * Published DEV.to posts from sibling `codenames-ai-guesser/docs/dev.to/published/`.
 * Titles/URLs from frontmatter; summaries compressed from openings — no invented claims.
 */
export const articles: Article[] = [
  {
    slug: "schema-first-valid-json-wasnt-enough",
    title: "Schema first, prompt second: valid JSON wasn't enough",
    summary:
      "Structured outputs and Zod catch shape errors, but board-legal moves need domain validation beyond valid JSON.",
    year: 2026,
    tags: ["ai", "typescript", "validation"],
    url: "https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm",
    relatedProjectSlug: "codenames-ai",
  },
  {
    slug: "model-experiments-architectural-stress-test",
    title: "Model experiments became an architectural stress test",
    summary:
      "A production model swap surfaced contract and validation failures that looked like quality regressions but were architectural gaps.",
    year: 2026,
    tags: ["ai", "testing", "architecture"],
    url: "https://dev.to/michaeltruong/model-experiments-became-an-architectural-stress-test-3gc0",
    relatedProjectSlug: "codenames-ai",
  },
  {
    slug: "active-players-which-sessions-counted",
    title: "Active players looked real until we asked which sessions counted",
    summary:
      "A healthy-looking Active players tile forced a sharper question about which sessions belonged in the metric.",
    year: 2026,
    tags: ["ai", "analytics"],
    url: "https://dev.to/michaeltruong/active-players-looked-real-until-we-asked-which-sessions-counted-11em",
    relatedProjectSlug: "codenames-ai",
  },
  {
    slug: "evidence-driven-dependency-upgrades",
    title: "Upgrades don't have to be a blind trust exercise",
    summary:
      "An evidence-driven Renovate ladder keeps dependency upgrades moving without treating green CI as a blank check.",
    year: 2026,
    tags: ["ai", "dependencies", "governance"],
    url: "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj",
    relatedProjectSlug: "renovate-governance",
  },
  {
    slug: "agent-plans-authority-handoffs",
    title: "The agent plan had every step except where to stop",
    summary:
      "Multi-slice agent plans need explicit authority handoffs and stop lines — not only implementation checklists.",
    year: 2026,
    tags: ["ai", "automation", "governance"],
    url: "https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h",
    relatedProjectSlug: "renovate-governance",
  },
];

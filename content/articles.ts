import type { Article } from "@/domain/article";

/**
 * Full published DEV.to inventory from sibling
 * `codenames-ai-guesser/docs/dev.to/published/`.
 * Titles/URLs from frontmatter; summaries compressed from openings — no invented claims.
 * `featured` marks homepage candidates; project pages filter via `relatedProjectSlug`.
 */
export const articles: Article[] = [
  {
    slug: "cloud-agent-felt-like-hiring",
    title: "I expected pair programming with a Cloud Agent. I got a new hire.",
    summary:
      "A first Cursor Cloud Agent run felt less like remote pair programming and more like briefing a new hire in a clean environment.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/the-first-cloud-agent-felt-less-like-pair-programming-and-more-like-hiring-an-engineer-18j4",
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
    featured: true,
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
    featured: true,
  },
  {
    slug: "reviewers-analysis-before-scoring",
    title: "The AI reviewer scored 23/25 and missed the point",
    summary:
      "An editorial AI reviewer that scored first produced QA feedback when the draft needed editorial judgment.",
    year: 2026,
    tags: ["ai", "workflow"],
    url: "https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh",
    relatedProjectSlug: "editorial-workflow",
    featured: true,
  },
  {
    slug: "ai-reviewer-kinds-of-reasoning",
    title: "I fixed my AI reviewer. Then I kept solving the wrong problem",
    summary:
      "After fixing score-first critique, further reviewer gains came from separating kinds of reasoning rather than expanding the rubric.",
    year: 2026,
    tags: ["ai", "workflow", "agents"],
    url: "https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-58am",
    relatedProjectSlug: "editorial-workflow",
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
    featured: true,
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
    featured: true,
  },
  {
    slug: "one-example-beats-style-guide",
    title: "One good example beat every AI writing rule I wrote",
    summary:
      "Teaching an editorial pipeline a writing voice worked better from one strong example than from an ever-growing style rule file.",
    year: 2026,
    tags: ["ai", "writing"],
    url: "https://dev.to/michaeltruong/one-good-example-beat-every-ai-writing-rule-i-wrote-7oo",
    relatedProjectSlug: "editorial-workflow",
    featured: true,
  },
  {
    slug: "schema-first-valid-json-wasnt-enough",
    title: "Schema first, prompt second: valid JSON wasn't enough",
    summary:
      "Structured outputs and Zod catch shape errors, but board-legal moves need domain validation beyond valid JSON.",
    year: 2026,
    tags: ["ai", "typescript", "validation"],
    url: "https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm",
    relatedProjectSlug: "codenames-ai",
    featured: true,
  },
];

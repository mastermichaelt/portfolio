import type { Article } from "@/domain/article";

/**
 * Curated DEV.to inventory synced from sibling hub
 * `editorial-workflow/docs/dev.to/published/` (15 posts; portfolio lists full corpus).
 * Titles/URLs from frontmatter; summaries compressed from openings — no invented claims.
 * `featured` marks the homepage selected-writing set (`content/homepage.ts`
 * `writing[]` slugs); project pages filter via `relatedProjectSlug`.
 *
 * Reasoning lines (`line`) and membership are from
 * `docs/content-evidence-migration.md` §5.I; the public labels are the approved
 * 2a rewording (see `content/article-lines.ts`). Each line has exactly one
 * `lineLead`, and only leads carry an `argument`.
 *
 * `argument` provenance:
 * - Three are verbatim from `content/homepage.ts` `writing[]`
 *   (`active-players-which-sessions-counted`, `agent-plans-authority-handoffs`,
 *   `ai-reviewer-kinds-of-reasoning`).
 * - Two were authored 2026-09-14 from each post's own published DEV takeaway,
 *   with no claim strengthened:
 *   · `persist-game-state-not-ephemeral-ui-intent` — from the takeaway of
 *     dev.to/michaeltruong/the-board-came-back-the-highlights-lied-18bo
 *     (edited 2026-09-06).
 *   · `agent-portability-does-not-require-centralizing-methodology-behind-mcp` —
 *     from the takeaway of
 *     dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-1406
 *     (edited 2026-09-10).
 *   The sibling hub `editorial-workflow/docs/dev.to/published/` remains master.
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
    line: "portability",
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
    line: "measurement",
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
    line: "authority",
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
    line: "critique",
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
    featured: true,
    line: "critique",
    lineLead: true,
    argument:
      "After fixing score-first critique, further reviewer gains came from separating kinds of reasoning rather than expanding the rubric.",
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
    line: "authority",
    lineLead: true,
    argument:
      "Multi-slice agent plans need explicit authority handoffs and stop lines — not only implementation checklists.",
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
    line: "measurement",
    lineLead: true,
    argument:
      "A healthy-looking Active players tile forced a sharper question about which sessions belonged in the metric.",
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
    line: "critique",
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
    line: "measurement",
  },
  {
    slug: "experiment-repos-need-first-class-retirement-semantics",
    title:
      "Throwaway experiments are easy to start. Retiring one safely is not",
    summary:
      "Closing a throwaway agent-workflow experiment repo surfaced missing retirement semantics.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/throwaway-experiments-are-easy-to-start-retiring-one-safely-is-not-2afe",
    line: "authority",
  },
  {
    slug: "persist-game-state-not-ephemeral-ui-intent",
    title: "The board came back. The highlights lied.",
    summary:
      "Reloading a Codenames AI tab restored the board while UI highlights no longer matched persisted game state.",
    year: 2026,
    tags: ["ai", "webdev", "typescript"],
    url: "https://dev.to/michaeltruong/the-board-came-back-the-highlights-lied-18bo",
    relatedProjectSlug: "codenames-ai",
    line: "readiness",
    lineLead: true,
    argument:
      "Coming back should restore what the product has accepted as true, not whatever was on screen — the persistence boundary is semantic, not architectural.",
  },
  {
    slug: "agent-portability-does-not-require-centralizing-methodology-behind-mcp",
    title: "I was solving agent portability at the wrong boundary",
    summary:
      "Copying one repo's agent setup into a new project worked until product-specific boundaries came along.",
    year: 2026,
    tags: ["ai", "agents", "workflow", "cursor"],
    url: "https://dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-1406",
    line: "portability",
    lineLead: true,
    argument:
      "Portability is a question of ownership and lifecycle, not a service boundary.",
  },
  {
    slug: "ai-workflows-need-a-requirements-qa-stage",
    title: "The pipeline was green. The product was underspecified",
    summary:
      "Green CI on a resume pipeline did not mean the output was ready to send.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/the-pipeline-was-green-the-product-was-underspecified-1fnj",
    relatedProjectSlug: "resume-generator",
    line: "readiness",
  },
  {
    slug: "ai-changed-the-build-vs-buy-threshold",
    title: "AI changed the build-vs-buy threshold",
    summary:
      "Building a resume platform under recruiter deadline pressure changed the build-vs-buy calculus.",
    year: 2026,
    tags: ["ai", "automation", "workflow"],
    url: "https://dev.to/michaeltruong/build-looked-absurd-under-a-recruiter-deadline-1145",
    relatedProjectSlug: "resume-generator",
    line: "readiness",
  },
  {
    slug: "skills-should-own-capabilities-not-individual-actions",
    title: "One skill per action looked like the safe boundary",
    summary:
      "An editorial pipeline in Cursor showed that one skill per action was the wrong capability boundary.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/one-skill-per-action-looked-like-the-safe-boundary-13pj",
    relatedProjectSlug: "editorial-workflow",
    line: "critique",
  },
];

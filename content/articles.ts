import type { Article } from "@/domain/article";

/**
 * Curated DEV.to inventory synced from sibling hub
 * `editorial-workflow/docs/dev.to/published/` (21 posts; portfolio lists full corpus).
 * Titles/URLs from frontmatter; summaries compressed from openings — no invented claims.
 * `featured` marks the homepage selected-writing set (`content/homepage.ts`
 * `writing[]` slugs); project pages filter via `relatedProjectSlug`.
 *
 * Lifecycle stages (`line`) follow TEAM then Portability in render order (see
 * `content/article-lines.ts`). Assign each report to the stage whose
 * **primary engineering question** the post answers, not title keywords.
 * Each stage has exactly one `lineLead`, and only leads carry an `argument`.
 *
 * `argument` provenance: each line lead `argument` is one sentence compressed
 * from that post's published **Takeaway:** (or opening thesis where noted),
 * with no claim strengthened. The sibling hub `editorial-workflow/docs/dev.to/published/` remains
 * master.
 */
export const articles: Article[] = [
  // Taste (5)
  {
    slug: "ai-workflows-need-a-requirements-qa-stage",
    title: "The pipeline was green. The product was underspecified",
    summary:
      "Green CI on a resume pipeline did not mean the output was ready to send.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/the-pipeline-was-green-the-product-was-underspecified-1fnj",
    line: "taste",
    lineLead: true,
    argument:
      "Green CI can mean the pipeline worked while the product stayed underspecified.",
  },
  {
    slug: "ai-changed-the-build-vs-buy-threshold",
    title: "AI changed the build-vs-buy threshold",
    summary:
      "Building a resume platform under recruiter deadline pressure changed the build-vs-buy calculus.",
    year: 2026,
    tags: ["ai", "automation", "workflow"],
    url: "https://dev.to/michaeltruong/build-looked-absurd-under-a-recruiter-deadline-1145",
    line: "taste",
  },
  {
    slug: "ai-made-translation-cheap-localization-still-needed-human-judgment",
    title:
      "AI made translation cheap. The hard part was knowing what architecture to keep.",
    summary:
      "AI made producing translations cheap; it did not tell me what deserved to become permanent product structure.",
    year: 2026,
    tags: ["ai", "webdev", "programming"],
    url: "https://dev.to/michaeltruong/ai-made-translation-cheap-the-hard-part-was-knowing-what-architecture-to-keep-4hp3",
    relatedProjectSlug: "codenames-ai",
    line: "taste",
  },
  {
    slug: "the-retrieval-pipeline-worked-the-product-question-remained",
    title: "The retrieval pipeline worked. The product question remained.",
    summary:
      "Retrieval fixtures passed while the settings that served real visitor questions still needed judgment.",
    year: 2026,
    tags: ["ai", "agents", "webdev"],
    url: "https://dev.to/michaeltruong/the-retrieval-pipeline-worked-the-product-question-remained-80c",
    line: "taste",
  },
  {
    slug: "one-example-beats-style-guide",
    title: "One good example beat every AI writing rule I wrote",
    summary:
      "Teaching an editorial pipeline a writing voice worked better from one strong example than from an expanding list of style rules.",
    year: 2026,
    tags: ["ai", "writing"],
    url: "https://dev.to/michaeltruong/one-good-example-beat-every-ai-writing-rule-i-wrote-7oo",
    relatedProjectSlug: "editorial-workflow",
    line: "taste",
  },
  // Evals & Verification (4)
  {
    slug: "ai-reviewer-kinds-of-reasoning",
    title: "I fixed my AI reviewer. Then I kept solving the wrong problem",
    summary:
      "Once analysis came before scoring, further reviewer gains came from separating kinds of reasoning rather than expanding the rubric.",
    year: 2026,
    tags: ["ai", "workflow", "agents"],
    url: "https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-58am",
    relatedProjectSlug: "editorial-workflow",
    featured: true,
    line: "evals",
    lineLead: true,
    argument: "Passing the check is not the same as getting the draft right.",
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
    line: "evals",
  },
  {
    slug: "schema-first-valid-json-wasnt-enough",
    title: "Schema first, prompt second: valid JSON wasn't enough",
    summary:
      "Structured outputs and Zod catch shape errors, but legal moves on the board still need domain validation beyond valid JSON.",
    year: 2026,
    tags: ["ai", "typescript", "validation"],
    url: "https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm",
    relatedProjectSlug: "codenames-ai",
    line: "evals",
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
    line: "evals",
  },
  // Authority (5)
  {
    slug: "agent-plans-authority-handoffs",
    title: "The agent plan had every step except where to stop",
    summary:
      "Plans that span several pull requests need explicit authority handoffs and stop lines, not only implementation checklists.",
    year: 2026,
    tags: ["ai", "automation", "governance"],
    url: "https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h",
    relatedProjectSlug: "renovate-governance",
    featured: true,
    line: "authority",
  },
  {
    slug: "evidence-driven-dependency-upgrades",
    title: "Upgrades don't have to be a blind trust exercise",
    summary:
      "A Renovate ladder built on evidence packets keeps dependency upgrades moving without treating green CI as a blank check.",
    year: 2026,
    tags: ["ai", "dependencies", "governance"],
    url: "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj",
    relatedProjectSlug: "renovate-governance",
    line: "authority",
  },
  {
    slug: "hook-availability-was-split-from-product-enforcement-after-silent-skip",
    title: "Git said the commit succeeded. My hooks never ran.",
    summary:
      "Git reported a successful commit while Husky never ran, so a configured hook path did not prove anything would run there.",
    year: 2026,
    tags: ["ai", "agents", "workflow", "governance"],
    url: "https://dev.to/michaeltruong/git-said-the-commit-succeeded-my-hooks-never-ran-49e2",
    line: "authority",
  },
  {
    slug: "experiment-repos-need-first-class-retirement-semantics",
    title:
      "Throwaway experiments are easy to start. Retiring one safely is not",
    summary:
      "Closing a throwaway experiment repo for an agent workflow surfaced missing retirement semantics.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/throwaway-experiments-are-easy-to-start-retiring-one-safely-is-not-2afe",
    line: "authority",
  },
  {
    slug: "the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed",
    title: "The agent host didn't have the lifecycle boundaries I assumed",
    summary:
      "Integrating Savepoints exposed lifecycle boundaries the agent host did not actually provide.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed-5akh",
    line: "authority",
    lineLead: true,
    argument: "You still have to define where agent work stops.",
  },
  // Measurement (3)
  {
    slug: "active-players-which-sessions-counted",
    title: "Active players looked real until we asked which sessions counted",
    summary:
      "The Active players tile looked convincing until we asked which sessions belonged in the metric.",
    year: 2026,
    tags: ["ai", "analytics"],
    url: "https://dev.to/michaeltruong/active-players-looked-real-until-we-asked-which-sessions-counted-11em",
    relatedProjectSlug: "codenames-ai",
    featured: true,
    line: "measurement",
    lineLead: true,
    argument: "A metric is only useful when you know what it counts.",
  },
  {
    slug: "records-first-chart-second-the-sankey-disagreed",
    title: "I visualised my job search. The data model started breaking.",
    summary:
      "Irregular hiring histories meant I had to fix the records before a Sankey could show what actually happened.",
    year: 2026,
    tags: ["ai", "programming", "analytics"],
    url: "https://dev.to/michaeltruong/records-first-chart-second-the-sankey-disagreed-3841",
    line: "measurement",
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
  // Portability (4)
  {
    slug: "agent-portability-does-not-require-centralizing-methodology-behind-mcp",
    title: "I was solving agent portability at the wrong boundary",
    summary:
      "Copying one repo's agent setup into a new project worked until each product needed its own boundaries.",
    year: 2026,
    tags: ["ai", "agents", "workflow", "cursor"],
    url: "https://dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-1406",
    line: "portability",
    lineLead: true,
    argument:
      "Copying agent setup is easy; keeping it aligned across projects is not.",
  },
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
    slug: "skills-should-own-capabilities-not-individual-actions",
    title: "One skill per action looked like the safe boundary",
    summary:
      "An editorial pipeline in Cursor showed that one skill per action was the wrong capability boundary.",
    year: 2026,
    tags: ["ai", "agents", "workflow"],
    url: "https://dev.to/michaeltruong/one-skill-per-action-looked-like-the-safe-boundary-13pj",
    relatedProjectSlug: "editorial-workflow",
    line: "portability",
  },
  {
    slug: "we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable",
    title:
      "We made our agent plans portable. Then we had to make them verifiable.",
    summary:
      "Sharing planning methodology across six repos did not keep plans structurally consistent until deterministic validation ran in CI.",
    year: 2026,
    tags: ["ai", "workflow", "governance"],
    url: "https://dev.to/michaeltruong/we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable-3ead",
    line: "portability",
  },
];

/** Curated DEV inventory count (same list as `/articles`). */
export const publishedArticleCount = articles.length;

/** Field reports tagged to Codenames AI (`relatedProjectSlug`). */
export const codenamesTaggedArticleCount = articles.filter(
  (article) => article.relatedProjectSlug === "codenames-ai",
).length;

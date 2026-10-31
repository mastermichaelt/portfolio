import type { ArticleLineDefinition } from "@/domain/article";

/**
 * The five lifecycle stages of `/articles`, in fixed render order (direction 2a).
 *
 * Stages 01–04 are **TEAM** (Taste → Evals → Authority → Measurement): the
 * in-product engineering loop. Stage 05 (**Portability**) is how that loop is
 * reproduced across repositories, agents, and tools.
 *
 * Classify each report by the **primary engineering question** it answers, not
 * title keywords. Membership lives on `Article.line` in `content/articles.ts`;
 * counts are 3 / 8 / 5 / 2 / 3.
 */
export const articleLines: ArticleLineDefinition[] = [
  {
    id: "taste",
    label: "Taste",
    lifecycleQuestion:
      "What is worth building, and what counts as a good outcome?",
    pairs: "Codenames AI; resume pipeline",
  },
  {
    id: "evals",
    label: "Evals & Verification",
    lifecycleQuestion:
      "How do we establish implementation correctness and quality?",
    pairs: "Editorial workflow; Codenames AI",
  },
  {
    id: "authority",
    label: "Authority",
    lifecycleQuestion: "What are agents permitted to change?",
    pairs: "Renovate governance; agent-native",
    note: "Governance across plans, git hooks, and agent host boundaries. Several rows carry no single system.",
  },
  {
    id: "measurement",
    label: "Measurement",
    lifecycleQuestion:
      "What do deployed behaviour and production outcomes show?",
    pairs: "Codenames AI; career analytics",
  },
  {
    id: "portability",
    label: "Portability",
    lifecycleQuestion:
      "How do we apply these practices consistently across projects, tools, and agents?",
    pairs: "agent-native / editorial",
    note: "Transfer of methodology across repositories and hosts, not one product surface.",
  },
];

/** A system a report pairs with: short display label and, where one exists, its route. */
export interface ArticleSystemRef {
  label: string;
  href?: string;
}

/**
 * Short display labels and routes for the systems reports pair with, keyed by
 * `Article.relatedProjectSlug`. Labels mirror the short forms in
 * `content/projects-index.ts` (co-primary case name and supporting-row titles);
 * routes are the real `/projects/*` routes.
 */
export const articleSystems: Record<string, ArticleSystemRef> = {
  "codenames-ai": { label: "Codenames AI", href: "/projects/codenames-ai" },
  "renovate-governance": {
    label: "Renovate governance",
    href: "/projects/renovate-governance",
  },
  "editorial-workflow": {
    label: "Editorial workflow",
    href: "/projects/editorial-workflow",
  },
};

/**
 * Resolve a report's `relatedProjectSlug` to its system ref, or `null` when the
 * slug is absent or unknown. Shared by the `/articles` page and its tests so the
 * lookup rule has a single source. Matches the `ResolveSystem` signature.
 */
export function resolveArticleSystem(
  slug: string | undefined,
): ArticleSystemRef | null {
  return slug ? (articleSystems[slug] ?? null) : null;
}

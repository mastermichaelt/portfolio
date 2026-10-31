import type { ArticleLineDefinition } from "@/domain/article";

/**
 * The five reasoning lines of `/articles`, in fixed render order (direction 2a).
 *
 * Lines 01–04 are TEAM (Taste, Evals, Authority, Measurement): four core
 * disciplines of AI-native engineering. Line 05 (Portability) is cross-cutting.
 *
 * `label` values are the public category names. `pairs` is the project-tier
 * pairing metadata (not rendered on the page). Membership lives on each
 * `Article.line` in `content/articles.ts`; counts are 4 / 7 / 5 / 2 / 3.
 */
export const articleLines: ArticleLineDefinition[] = [
  {
    id: "taste",
    label: "Taste",
    pairs: "Codenames AI; resume pipeline",
    note: "Whether the product question, requirements, or architecture deserve the work, not whether the pipeline passed.",
  },
  {
    id: "evals",
    label: "Evals",
    pairs: "Editorial workflow; Codenames AI",
  },
  {
    id: "authority",
    label: "Authority",
    pairs: "Renovate governance; agent-native",
    note: "Plans, git hooks, and host lifecycle boundaries across repos. Several rows still carry no single system.",
  },
  {
    id: "measurement",
    label: "Measurement",
    pairs: "Codenames AI; career analytics",
  },
  {
    id: "portability",
    label: "Portability",
    pairs: "agent-native / editorial",
    note: "How practices move between repositories, agents, and tools, not a single product surface.",
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

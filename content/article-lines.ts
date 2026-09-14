import type { ArticleLineDefinition } from "@/domain/article";

/**
 * The five reasoning lines of `/articles`, in fixed render order (direction 2a).
 *
 * `label` values are the approved public-facing wording (handoff §3.2);
 * `pairs` is the project-tier pairing shown in each band head, verbatim from
 * `docs/content-evidence-migration.md` §5.I; `note` is the band note for the two
 * lines whose reports carry no single system (handoff §4). Membership lives on
 * each `Article.line` in `content/articles.ts`; the counts are 3 / 3 / 4 / 3 / 2.
 */
export const articleLines: ArticleLineDefinition[] = [
  {
    id: "measurement",
    label: "Measurement & telemetry",
    pairs: "Codenames AI — co-primary",
  },
  {
    id: "authority",
    label: "Authority & stop conditions",
    pairs: "Renovate governance; agent-native",
    note: "One report in this line — retiring a throwaway experiment repo — carries no system either. Three of fifteen reports sit this way; the line is paired, the row is not.",
  },
  {
    id: "critique",
    label: "Critique & review quality",
    pairs: "Editorial workflow — supporting",
  },
  {
    id: "readiness",
    label: "Readiness & verification",
    pairs: "Resume generator; Codenames AI",
  },
  {
    id: "portability",
    label: "Agent portability",
    pairs: "agent-native / editorial",
    note: "Neither report here documents a single system — they describe how agent setups move between projects. The line is paired, the rows are not.",
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
 * routes are the real `/projects/*` routes. `resume-generator` is infrastructure
 * with no public detail route, so it renders as a plain-text label only — which
 * is all the archive rows ever need (handoff §6/§8).
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
  "resume-generator": { label: "Resume generator" },
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

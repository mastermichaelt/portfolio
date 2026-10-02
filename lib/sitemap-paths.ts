/** Static routes included in the sitemap. */
export const STATIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/projects",
  "/articles",
  "/ecosystem",
] as const;

/**
 * Project detail slugs — same union as `generateStaticParams` on
 * `/projects/[slug]`.
 */
export const PROJECT_SITEMAP_SLUGS = [
  "experiment-measurement",
  "codenames-ai",
  "editorial-workflow",
  "renovate-governance",
  "resume-generator",
] as const;

export type ProjectSitemapSlug = (typeof PROJECT_SITEMAP_SLUGS)[number];

/** All pathname entries for the sitemap (5 static + 5 project). */
export function getSitemapPaths(): readonly string[] {
  return [
    ...STATIC_SITEMAP_PATHS,
    ...PROJECT_SITEMAP_SLUGS.map((slug) => `/projects/${slug}`),
  ];
}

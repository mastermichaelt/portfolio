/** Display name for the site owner and default author metadata. */
export const SITE_NAME = "Michael Truong";

/** Default document title and Open Graph / Twitter title on the homepage. */
export const SITE_TITLE =
  "Michael Truong · Making uncertain systems dependable";

/** Title template for nested routes (`%s · Michael Truong`). */
export const SITE_TITLE_TEMPLATE = "%s · Michael Truong";

/**
 * Default site description for the root layout, manifest, and non-home routes
 * that inherit layout metadata without overriding description.
 */
export const SITE_DESCRIPTION =
  "Michael Truong — Senior Software Engineer and AI Product Engineer in Sydney. Growth experimentation, attribution and platform measurement at Atlassian (2014–2025). Independent AI products and agent-native engineering systems since 2026 — the same practice: measure it, validate it, and write down what the system is allowed to do.";

/**
 * Homepage-specific description — shorter than {@link SITE_DESCRIPTION} and
 * aligned across page metadata, Open Graph, and Twitter on `/`.
 */
export const HOME_DESCRIPTION =
  "Michael Truong — Senior Software Engineer and AI Product Engineer in Sydney. Atlassian measurement and verification practice (2014–2025), independent AI products since 2026, and evidence-backed field reports.";

/**
 * Curated site keywords for `metadata.keywords` completeness (not ranking).
 * Keep in sync with profile positioning and primary content themes.
 */
export const SITE_KEYWORDS = [
  "Michael Truong",
  "Senior Software Engineer",
  "AI Product Engineer",
  "Sydney",
  "software engineering portfolio",
  "growth experimentation",
  "platform measurement",
  "attribution",
  "Atlassian",
  "AI products",
  "agent-native engineering",
  "experimentation",
  "measurement",
  "engineering field reports",
] as const;

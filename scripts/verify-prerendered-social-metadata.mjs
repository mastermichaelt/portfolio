#!/usr/bin/env node
/**
 * Post-build regression: prerendered HTML must expose og:image / twitter:image on
 * indexable routes — the default card on static routes, the per-slug card on
 * case studies (with its own alt text, dimensions and Twitter copy). Case-study
 * routes are discovered from the build output, so a new slug cannot skip these
 * checks. Run after `npm run build` (CI runs this immediately after build).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = resolve(root, ".next/server/app");

const SITE_ORIGIN = "https://michaeltruong.ai";

const DEFAULT_CARD = {
  ogImage: `${SITE_ORIGIN}/opengraph-image`,
  twitterImage: `${SITE_ORIGIN}/twitter-image`,
};

const STATIC_ROUTES = [
  { html: "index.html", ogUrl: SITE_ORIGIN },
  { html: "about.html", ogUrl: `${SITE_ORIGIN}/about` },
  { html: "projects.html", ogUrl: `${SITE_ORIGIN}/projects` },
  { html: "articles.html", ogUrl: `${SITE_ORIGIN}/articles` },
];

/** Must always prerender; any other slug found in the build is checked too. */
const KNOWN_CASE_STUDY_SLUGS = [
  "codenames-ai",
  "experiment-measurement",
  "editorial-workflow",
  "renovate-governance",
];

const PORTRAIT_URL = `${SITE_ORIGIN}/portrait-michael-1200.jpg`;

function fail(message) {
  console.error(`verify:social-metadata — ${message}`);
  process.exit(1);
}

if (!existsSync(appDir)) {
  fail("missing .next/server/app — run npm run build first");
}

const CASE_STUDY_SLUGS = readdirSync(resolve(appDir, "projects"))
  .filter((file) => file.endsWith(".html"))
  .map((file) => file.slice(0, -".html".length))
  .sort();

for (const slug of KNOWN_CASE_STUDY_SLUGS) {
  if (!CASE_STUDY_SLUGS.includes(slug)) {
    fail(`missing prerendered case study projects/${slug}.html`);
  }
}

const ROUTES = [
  ...STATIC_ROUTES.map((route) => ({ ...route, card: DEFAULT_CARD })),
  ...CASE_STUDY_SLUGS.map((slug) => ({
    caseStudy: true,
    html: `projects/${slug}.html`,
    ogUrl: `${SITE_ORIGIN}/projects/${slug}`,
    card: {
      ogImage: `${SITE_ORIGIN}/projects/${slug}/opengraph-image`,
      twitterImage: `${SITE_ORIGIN}/projects/${slug}/twitter-image`,
    },
  })),
];

/** `content` values of every `<meta property|name="key">` tag. */
function metaContents(html, key) {
  const pattern = new RegExp(
    `<meta (?:property|name)="${key}" content="([^"]*)"`,
    "g",
  );
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function assertImageTag(html, key, expectedPrefix, label) {
  const contents = metaContents(html, key);
  if (contents.length === 0) {
    fail(`${label}: missing ${key} meta tag`);
  }
  for (const content of contents) {
    if (!content.startsWith(expectedPrefix)) {
      fail(`${label}: ${key} "${content}" must start with ${expectedPrefix}`);
    }
  }
}

/** The single `content` of a `<meta>` tag, failing when absent or repeated. */
function metaContent(html, key, label) {
  const contents = metaContents(html, key);
  if (contents.length !== 1) {
    fail(
      `${label}: expected exactly one ${key} meta tag, found ${contents.length}`,
    );
  }
  return contents[0];
}

/** Per-slug card alt and size, and case-study (not site-wide) Twitter copy. */
function assertCaseStudyCard(html, label) {
  const ogAlt = metaContent(html, "og:image:alt", label);
  if (ogAlt.length < 40) {
    fail(`${label}: og:image:alt must describe the card, got "${ogAlt}"`);
  }
  if (metaContent(html, "twitter:image:alt", label) !== ogAlt) {
    fail(`${label}: twitter:image:alt must match og:image:alt`);
  }
  for (const key of ["og:image:width", "og:image:height"]) {
    if (!/^[1-9]\d*$/.test(metaContent(html, key, label))) {
      fail(`${label}: ${key} must be a positive integer`);
    }
  }
  for (const field of ["title", "description"]) {
    if (
      metaContent(html, `twitter:${field}`, label) !==
      metaContent(html, `og:${field}`, label)
    ) {
      fail(
        `${label}: twitter:${field} must match og:${field} (case-study copy, not the site default)`,
      );
    }
  }
}

function assertOgUrl(html, expectedUrl, label) {
  const needle = `property="og:url" content="${expectedUrl}"`;
  if (!html.includes(needle)) {
    fail(`${label}: expected ${needle}`);
  }
}

for (const route of ROUTES) {
  const path = resolve(appDir, route.html);
  if (!existsSync(path)) {
    fail(`missing prerender artifact ${route.html}`);
  }
  const html = readFileSync(path, "utf8");
  const label = route.html;
  assertImageTag(html, "og:image", route.card.ogImage, label);
  assertImageTag(html, "twitter:image", route.card.twitterImage, label);
  if (route.caseStudy) assertCaseStudyCard(html, label);
  assertOgUrl(html, route.ogUrl, label);
}

const aboutHtml = readFileSync(resolve(appDir, "about.html"), "utf8");
if (!aboutHtml.includes(`"image":"${PORTRAIT_URL}"`)) {
  fail("about.html: Person JSON-LD must include canonical portrait image URL");
}

console.log(
  `verify:social-metadata — ok (${ROUTES.length} routes incl. ${CASE_STUDY_SLUGS.length} case studies, Person.image on about)`,
);

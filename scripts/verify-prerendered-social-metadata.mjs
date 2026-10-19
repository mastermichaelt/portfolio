#!/usr/bin/env node
/**
 * Post-build regression: prerendered HTML must expose og:image / twitter:image on
 * indexable routes — the default card on static routes, the per-slug card on
 * case studies (never the default). Run after `npm run build` (CI runs this
 * immediately after build).
 */
import { existsSync, readFileSync } from "node:fs";
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

const CASE_STUDY_SLUGS = [
  "codenames-ai",
  "experiment-measurement",
  "editorial-workflow",
  "renovate-governance",
];

const ROUTES = [
  ...STATIC_ROUTES.map((route) => ({ ...route, card: DEFAULT_CARD })),
  ...CASE_STUDY_SLUGS.map((slug) => ({
    html: `projects/${slug}.html`,
    ogUrl: `${SITE_ORIGIN}/projects/${slug}`,
    card: {
      ogImage: `${SITE_ORIGIN}/projects/${slug}/opengraph-image`,
      twitterImage: `${SITE_ORIGIN}/projects/${slug}/twitter-image`,
    },
  })),
];

const PORTRAIT_URL = `${SITE_ORIGIN}/portrait-michael-1200.jpg`;

function fail(message) {
  console.error(`verify:social-metadata — ${message}`);
  process.exit(1);
}

if (!existsSync(appDir)) {
  fail("missing .next/server/app — run npm run build first");
}

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

function assertNoDefaultCard(html, label) {
  for (const key of ["og:image", "twitter:image"]) {
    for (const content of metaContents(html, key)) {
      if (
        content.startsWith(DEFAULT_CARD.ogImage) ||
        content.startsWith(DEFAULT_CARD.twitterImage)
      ) {
        fail(`${label}: ${key} must not use the default card (${content})`);
      }
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
  if (route.card !== DEFAULT_CARD) assertNoDefaultCard(html, label);
  assertOgUrl(html, route.ogUrl, label);
}

const aboutHtml = readFileSync(resolve(appDir, "about.html"), "utf8");
if (!aboutHtml.includes(`"image":"${PORTRAIT_URL}"`)) {
  fail("about.html: Person JSON-LD must include canonical portrait image URL");
}

console.log(
  `verify:social-metadata — ok (${ROUTES.length} routes, Person.image on about)`,
);

#!/usr/bin/env node
/**
 * Post-build regression: prerendered HTML must expose og:image / twitter:image on
 * indexable routes — the default card on static routes, the per-slug card on
 * case studies (with its own alt text, dimensions, Twitter copy and
 * content-versioned URL). Case-study routes come from the prerender manifest
 * (not a directory scan, which also sees pages `next start` caches at runtime)
 * and must match the approved PNGs one-to-one, each prerendered and traced into
 * the server bundles that read it. Run after `npm run build` (CI runs this
 * immediately after build).
 */
import { createHash } from "node:crypto";
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
  { html: "projects.html", ogUrl: `${SITE_ORIGIN}/projects` },
  { html: "articles.html", ogUrl: `${SITE_ORIGIN}/articles` },
];

const CARDS_DIR = resolve(root, "app/projects/[slug]/_cards");

const PORTRAIT_URL = `${SITE_ORIGIN}/portrait-michael-1200.jpg`;

const ABOUT_ROUTE = {
  html: "about.html",
  ogUrl: `${SITE_ORIGIN}/about`,
  card: { ogImage: PORTRAIT_URL, twitterImage: PORTRAIT_URL },
};

function fail(message) {
  console.error(`verify:social-metadata — ${message}`);
  process.exit(1);
}

if (!existsSync(appDir)) {
  fail("missing .next/server/app — run npm run build first");
}

const prerenderManifestPath = resolve(root, ".next/prerender-manifest.json");
if (!existsSync(prerenderManifestPath)) {
  fail("missing .next/prerender-manifest.json — run npm run build first");
}
const prerendered = Object.entries(
  JSON.parse(readFileSync(prerenderManifestPath, "utf8")).routes,
);

/** Paths prerendered at build from the given dynamic route. */
function prerenderedFrom(srcRoute) {
  return prerendered
    .filter(([, route]) => route.srcRoute === srcRoute)
    .map(([path]) => path);
}

const CASE_STUDY_SLUGS = prerenderedFrom("/projects/[slug]")
  .map((path) => path.slice("/projects/".length))
  .sort();

const CARD_SLUGS = readdirSync(CARDS_DIR)
  .filter((file) => file.endsWith(".png"))
  .map((file) => file.slice(0, -".png".length))
  .sort();

if (CASE_STUDY_SLUGS.join() !== CARD_SLUGS.join()) {
  fail(
    `prerendered case studies [${CASE_STUDY_SLUGS}] must match card PNGs in app/projects/[slug]/_cards [${CARD_SLUGS}]`,
  );
}

const prerenderedImages = prerenderedFrom("/projects/[slug]/opengraph-image");
for (const slug of CASE_STUDY_SLUGS) {
  if (!prerenderedImages.includes(`/projects/${slug}/opengraph-image`)) {
    fail(`/projects/${slug}/opengraph-image must be prerendered at build`);
  }
}

// Both the page (hashes the PNG for ?v=) and the image route (serves it) read
// the cards with fs at runtime; each server bundle's trace must ship them.
for (const bundle of ["page.js", "opengraph-image/route.js"]) {
  const tracePath = resolve(appDir, "projects/[slug]", `${bundle}.nft.json`);
  if (!existsSync(tracePath)) fail(`missing trace ${tracePath}`);
  const traced = JSON.parse(readFileSync(tracePath, "utf8")).files.map((file) =>
    resolve(dirname(tracePath), file),
  );
  for (const slug of CARD_SLUGS) {
    if (!traced.includes(resolve(CARDS_DIR, `${slug}.png`))) {
      fail(
        `projects/[slug]/${bundle} trace is missing _cards/${slug}.png (next.config.ts outputFileTracingIncludes)`,
      );
    }
  }
}

/** Mirrors caseStudyCardVersion in app/projects/[slug]/_cards/cards.ts. */
function cardVersion(slug) {
  const png = readFileSync(resolve(CARDS_DIR, `${slug}.png`));
  return createHash("sha256").update(png).digest("hex").slice(0, 12);
}

const ROUTES = [
  ...STATIC_ROUTES.map((route) => ({ ...route, card: DEFAULT_CARD })),
  { ...ABOUT_ROUTE, portraitPage: true },
  ...CASE_STUDY_SLUGS.map((slug) => {
    // Open Graph and Twitter share the one content-versioned image URL.
    const image = `${SITE_ORIGIN}/projects/${slug}/opengraph-image?v=${cardVersion(slug)}`;
    return {
      caseStudy: true,
      html: `projects/${slug}.html`,
      ogUrl: `${SITE_ORIGIN}/projects/${slug}`,
      card: { ogImage: image, twitterImage: image },
    };
  }),
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

/** Exact versioned card URL, per-slug alt and size, case-study Twitter copy. */
function assertCaseStudyCard(html, card, label) {
  for (const [key, expected] of [
    ["og:image", card.ogImage],
    ["twitter:image", card.twitterImage],
  ]) {
    const actual = metaContent(html, key, label);
    if (actual !== expected) {
      fail(`${label}: ${key} "${actual}" must be exactly ${expected}`);
    }
  }
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
  if (route.caseStudy || route.portraitPage) {
    assertCaseStudyCard(html, route.card, label);
  }
  assertOgUrl(html, route.ogUrl, label);
}

const aboutHtml = readFileSync(resolve(appDir, "about.html"), "utf8");
if (!aboutHtml.includes(`"image":"${PORTRAIT_URL}"`)) {
  fail("about.html: Person JSON-LD must include canonical portrait image URL");
}

console.log(
  `verify:social-metadata — ok (${ROUTES.length} routes incl. ${CASE_STUDY_SLUGS.length} case studies, Person.image on about)`,
);

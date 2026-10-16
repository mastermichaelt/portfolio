#!/usr/bin/env node
/**
 * Post-build regression: prerendered HTML must expose og:image on indexable routes.
 * Run after `npm run build` (CI runs this immediately after build).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = resolve(root, ".next/server/app");

const ROUTES = [
  { html: "index.html", ogUrl: "https://michaeltruong.ai" },
  { html: "about.html", ogUrl: "https://michaeltruong.ai/about" },
  { html: "projects.html", ogUrl: "https://michaeltruong.ai/projects" },
  { html: "articles.html", ogUrl: "https://michaeltruong.ai/articles" },
  {
    html: "projects/codenames-ai.html",
    ogUrl: "https://michaeltruong.ai/projects/codenames-ai",
  },
  {
    html: "projects/experiment-measurement.html",
    ogUrl: "https://michaeltruong.ai/projects/experiment-measurement",
  },
];

const SITE_ORIGIN = "https://michaeltruong.ai";
const OG_IMAGE_PREFIX = `${SITE_ORIGIN}/opengraph-image`;
const PORTRAIT_URL = `${SITE_ORIGIN}/portrait-michael-1200.jpg`;

function fail(message) {
  console.error(`verify:social-metadata — ${message}`);
  process.exit(1);
}

if (!existsSync(appDir)) {
  fail("missing .next/server/app — run npm run build first");
}

function assertOgImage(html, label) {
  if (!html.includes('property="og:image"')) {
    fail(`${label}: missing og:image meta tag`);
  }
  if (!html.includes(`content="${OG_IMAGE_PREFIX}`)) {
    fail(`${label}: og:image must reference ${OG_IMAGE_PREFIX}`);
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
  assertOgImage(html, label);
  assertOgUrl(html, route.ogUrl, label);
}

const aboutHtml = readFileSync(resolve(appDir, "about.html"), "utf8");
if (!aboutHtml.includes(`"image":"${PORTRAIT_URL}"`)) {
  fail("about.html: Person JSON-LD must include canonical portrait image URL");
}

console.log(
  `verify:social-metadata — ok (${ROUTES.length} routes, Person.image on about)`,
);

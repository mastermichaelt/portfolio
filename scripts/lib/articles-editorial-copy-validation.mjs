/**
 * Deterministic checks for /articles inventory editorial copy (summaries,
 * line-lead arguments, band labels/pairs/notes). No auto-fix; report only.
 */
import fs from "node:fs";
import path from "node:path";

/** Unicode em dash — rejected in scoped reader-facing strings. */
export const EM_DASH = "\u2014";

/**
 * Hyphenated terms allowed without appearing in a published fixture (pairing
 * labels, cross-post vocabulary, established product terms).
 */
export const EDITORIAL_COMPOUND_ALLOWLIST = new Set([
  "agent-native",
  "build-vs-buy",
  "co-primary",
  "score-first",
]);

const HYPHENATED_COMPOUND = /\b[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)+\b/gi;

/** @typedef {{ file: string, field: string, slug?: string, lineId?: string, text: string }} EditorialCopyEntry */

/**
 * @param {import("@/domain/article").Article[]} articles
 * @param {import("@/domain/article").ArticleLineDefinition[]} articleLines
 * @returns {EditorialCopyEntry[]}
 */
export function collectArticlesEditorialCopyEntries(articles, articleLines) {
  /** @type {EditorialCopyEntry[]} */
  const entries = [];

  for (const row of articles) {
    entries.push({
      file: "content/articles.ts",
      field: "summary",
      slug: row.slug,
      text: row.summary,
    });
    if (row.argument) {
      entries.push({
        file: "content/articles.ts",
        field: "argument",
        slug: row.slug,
        text: row.argument,
      });
    }
  }

  for (const line of articleLines) {
    entries.push({
      file: "content/article-lines.ts",
      field: "label",
      lineId: line.id,
      text: line.label,
    });
    entries.push({
      file: "content/article-lines.ts",
      field: "pairs",
      lineId: line.id,
      text: line.pairs,
    });
    if (line.note) {
      entries.push({
        file: "content/article-lines.ts",
        field: "note",
        lineId: line.id,
        text: line.note,
      });
    }
  }

  return entries;
}

/**
 * @param {string} markdown
 */
export function visibleFixtureProse(markdown) {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\s*/, "");
  return withoutFrontmatter.replace(/<!--[\s\S]*?-->/g, " ").toLowerCase();
}

/**
 * @param {string} fixturesDir
 * @param {string} slug
 */
export function loadFixtureProse(fixturesDir, slug) {
  const filePath = path.join(fixturesDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return visibleFixtureProse(fs.readFileSync(filePath, "utf8"));
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function extractHyphenatedCompounds(text) {
  const seen = new Set();
  /** @type {string[]} */
  const compounds = [];
  for (const match of text.matchAll(HYPHENATED_COMPOUND)) {
    const token = match[0].toLowerCase();
    if (seen.has(token)) continue;
    seen.add(token);
    compounds.push(token);
  }
  return compounds;
}

/**
 * @param {EditorialCopyEntry} entry
 * @param {Map<string, string>} fixtureProseBySlug
 * @param {Map<string, string>} lineCorpusByLineId
 */
function allowedCorpusForEntry(entry, fixtureProseBySlug, lineCorpusByLineId) {
  if (entry.slug) {
    return fixtureProseBySlug.get(entry.slug) ?? "";
  }
  if (entry.lineId) {
    return lineCorpusByLineId.get(entry.lineId) ?? "";
  }
  return "";
}

/**
 * @param {import("@/domain/article").Article[]} articles
 * @param {import("@/domain/article").ArticleLineDefinition[]} articleLines
 * @param {{ fixturesDir: string }} options
 */
export function validateArticlesEditorialCopy(articles, articleLines, options) {
  const { fixturesDir } = options;
  const entries = collectArticlesEditorialCopyEntries(articles, articleLines);

  /** @type {Map<string, string>} */
  const fixtureProseBySlug = new Map();
  for (const row of articles) {
    fixtureProseBySlug.set(row.slug, loadFixtureProse(fixturesDir, row.slug));
  }

  /** @type {Map<string, string>} */
  const lineCorpusByLineId = new Map();
  for (const line of articleLines) {
    const parts = articles
      .filter((row) => row.line === line.id)
      .map((row) => fixtureProseBySlug.get(row.slug) ?? "");
    lineCorpusByLineId.set(line.id, parts.join("\n"));
  }

  /** @type {string[]} */
  const errors = [];

  for (const entry of entries) {
    const loc = entry.slug
      ? `${entry.file} ${entry.field} slug=${entry.slug}`
      : `${entry.file} ${entry.field} line=${entry.lineId}`;

    if (entry.text.includes(EM_DASH)) {
      errors.push(`${loc}: contains Unicode em dash (U+2014)`);
    }

    const corpus = allowedCorpusForEntry(
      entry,
      fixtureProseBySlug,
      lineCorpusByLineId,
    );

    for (const compound of extractHyphenatedCompounds(entry.text)) {
      if (EDITORIAL_COMPOUND_ALLOWLIST.has(compound)) continue;
      if (corpus.includes(compound)) continue;
      errors.push(
        `${loc}: suspicious hyphenated compound "${compound}" (not in allowlist or published corpus for this scope)`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

import fs from "node:fs";
import path from "node:path";

import { stringifyFrontmatter } from "./yaml.mjs";

/**
 * @typedef {object} OkfConcept
 * @property {string} id Relative path under the corpus root (e.g. generated/okf/) without .md
 * @property {Record<string, unknown>} frontmatter
 * @property {string} body Markdown body (no frontmatter)
 */

/** Render one OKF concept document. */
export function renderConcept({ frontmatter, body }) {
  const yaml = stringifyFrontmatter(frontmatter);
  const trimmedBody = body.replace(/^\n+/, "");
  return `---\n${yaml}\n---\n\n${trimmedBody}\n`;
}

/** Write concepts to disk under corpusRoot, returning written relative paths. */
export function writeConcepts(corpusRoot, concepts) {
  const written = [];
  for (const concept of concepts) {
    const relativePath = `${concept.id}.md`;
    const absolutePath = path.join(corpusRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, renderConcept(concept), "utf8");
    written.push(relativePath);
  }
  return written;
}

/** Remove generated concept trees while preserving fixtures and inspection docs. */
export function cleanGeneratedConcepts(corpusRoot) {
  for (const dir of [
    "portfolio",
    "repo",
    "writing",
    "about",
    "career",
    "tooling",
  ]) {
    const target = path.join(corpusRoot, dir);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
  for (const file of ["index.md", "manifest.json"]) {
    const target = path.join(corpusRoot, file);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }
}

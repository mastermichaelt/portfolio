import fs from "node:fs";

import { splitFrontmatter } from "../okf/yaml.mjs";

/**
 * @typedef {import("./unit-schema.mjs").RetrievalSource} RetrievalSource
 */

/**
 * @typedef {object} ParsedOkfConcept
 * @property {string} okf_concept_id Concept path without `.md`
 * @property {string} type
 * @property {string} title
 * @property {string} resource
 * @property {RetrievalSource[]} sources
 * @property {string[]} tags
 * @property {Record<string, unknown>} generated
 * @property {string} body Markdown body (no frontmatter)
 */

function unquote(value) {
  return value.replace(/^["']|["']$/g, "");
}

/**
 * Parse OKF frontmatter shapes emitted by portfolio producers.
 * Not a general YAML parser — only the nested `sources`, `tags`, and `generated` blocks we control.
 */
export function parseOkfFrontmatter(yaml) {
  const result = {
    type: "",
    title: "",
    resource: "",
    sources: [],
    tags: [],
    generated: {},
  };

  const lines = yaml.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line === "sources:") {
      index += 1;
      while (index < lines.length && lines[index].startsWith("  -")) {
        const source = {};
        index += 1;
        while (
          index < lines.length &&
          lines[index].startsWith("    ") &&
          !lines[index].startsWith("    -")
        ) {
          const match = lines[index].match(/^\s{4}([^:]+):\s*(.*)$/);
          if (match) {
            source[match[1]] = unquote(match[2].trim());
          }
          index += 1;
        }
        if (Object.keys(source).length > 0) {
          result.sources.push(source);
        }
      }
      continue;
    }

    if (line === "tags:") {
      index += 1;
      while (index < lines.length) {
        const tagMatch = lines[index].match(/^\s{2}-\s+(.+)$/);
        if (!tagMatch) break;
        result.tags.push(unquote(tagMatch[1].trim()));
        index += 1;
      }
      continue;
    }

    if (line === "generated:") {
      index += 1;
      while (index < lines.length) {
        const nestedMatch = lines[index].match(/^\s{2}([^:]+):\s*(.*)$/);
        if (!nestedMatch) break;
        result.generated[nestedMatch[1]] = unquote(nestedMatch[2].trim());
        index += 1;
      }
      continue;
    }

    const scalarMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (scalarMatch) {
      result[scalarMatch[1]] = unquote(scalarMatch[2].trim());
    }
    index += 1;
  }

  return result;
}

/** Read one OKF concept markdown file from disk. */
export function readOkfConceptFile(absolutePath, okfConceptId) {
  const markdown = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(markdown);
  if (!frontmatter) {
    throw new Error(`OKF concept missing frontmatter: ${absolutePath}`);
  }

  const parsed = parseOkfFrontmatter(frontmatter);
  return {
    okf_concept_id: okfConceptId,
    type: parsed.type,
    title: parsed.title,
    resource: parsed.resource,
    sources: parsed.sources,
    tags: parsed.tags,
    generated: parsed.generated,
    body: body.replace(/^\n+/, "").replace(/\n+$/, ""),
  };
}

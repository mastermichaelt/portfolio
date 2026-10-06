/**
 * Minimal YAML helpers for OKF frontmatter we control.
 * Not a general-purpose parser — only the shapes producers emit or read.
 */

function quoteYamlString(value) {
  if (/[:#{}[\],&*?|>-]/.test(value) || value.includes('"')) {
    return JSON.stringify(value);
  }
  return value;
}

function serializeScalar(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return quoteYamlString(String(value));
}

function serializeList(key, items, indent = "") {
  if (!items?.length) return "";
  const lines = [`${indent}${key}:`];
  for (const item of items) {
    if (typeof item === "string") {
      lines.push(`${indent}  - ${serializeScalar(item)}`);
      continue;
    }
    lines.push(`${indent}  -`);
    for (const [childKey, childValue] of Object.entries(item)) {
      if (Array.isArray(childValue)) {
        lines.push(
          ...serializeList(childKey, childValue, `${indent}    `).split("\n"),
        );
        continue;
      }
      if (childValue && typeof childValue === "object") {
        lines.push(`${indent}    ${childKey}:`);
        for (const [nestedKey, nestedValue] of Object.entries(childValue)) {
          lines.push(
            `${indent}      ${nestedKey}: ${serializeScalar(nestedValue)}`,
          );
        }
        continue;
      }
      lines.push(`${indent}    ${childKey}: ${serializeScalar(childValue)}`);
    }
  }
  return lines.join("\n");
}

/** Serialize a flat/nested frontmatter object to YAML (no document markers). */
export function stringifyFrontmatter(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      const block = serializeList(key, value);
      if (block) lines.push(block);
      continue;
    }
    if (value && typeof value === "object") {
      lines.push(`${key}:`);
      for (const [childKey, childValue] of Object.entries(value)) {
        lines.push(`  ${childKey}: ${serializeScalar(childValue)}`);
      }
      continue;
    }
    lines.push(`${key}: ${serializeScalar(value)}`);
  }
  return lines.join("\n");
}

/** Split a markdown file into optional YAML frontmatter and body. */
export function splitFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return { frontmatter: null, body: markdown };
  }
  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) {
    return { frontmatter: null, body: markdown };
  }
  return {
    frontmatter: markdown.slice(4, end),
    body: markdown.slice(end + 5),
  };
}

/** Parse simple `key: value` YAML frontmatter (scalars and string lists). */
export function parseSimpleFrontmatter(yaml) {
  const result = {};
  let currentListKey = null;
  for (const line of yaml.split("\n")) {
    if (!line.trim()) continue;
    const listMatch = line.match(/^  - (.+)$/);
    if (listMatch && currentListKey) {
      result[currentListKey].push(listMatch[1].trim());
      continue;
    }
    const kvMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (!kvMatch) continue;
    const [, key, rawValue] = kvMatch;
    if (!rawValue) {
      result[key] = [];
      currentListKey = key;
      continue;
    }
    currentListKey = null;
    result[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return result;
}

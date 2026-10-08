/**
 * Structure-aware OKF body chunking for retrieval-unit derivation.
 *
 * Splits on markdown ATX headings (`#`–`###`) already present in OKF bodies.
 * Paragraph boundaries split oversized sections (token safeguard only).
 *
 * `unit_id` suffix scheme (when a concept yields more than one chunk):
 *   `unit/{okf_concept_id}#{partKey}`
 * where `partKey` is URL-safe and stable:
 *   - `intro` — body before the first heading
 *   - `{heading-slug}` — one chunk per heading section
 *   - `{heading-slug}-p{n}` — paragraph splits inside an oversized section (`n` is 1-based)
 *
 * Single-chunk concepts keep `unit/{okf_concept_id}` with no `#` suffix.
 */

/** Rough token estimate for OpenAI embed inputs (safeguard only). */
export const MAX_CHUNK_ESTIMATED_TOKENS = 1200;

const HEADING_RE = /^(#{1,3})\s+(.+)$/;

/**
 * @param {string} text
 * @returns {number}
 */
export function estimateTokenCount(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return Math.ceil(trimmed.length / 4);
}

/**
 * @param {string} heading
 * @returns {string}
 */
export function slugifyHeading(heading) {
  const slug = heading
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "section";
}

/**
 * @typedef {object} BodySection
 * @property {string | null} heading
 * @property {string} body
 */

/**
 * @param {string} body
 * @returns {BodySection[]}
 */
export function splitBodyIntoHeadingSections(body) {
  const normalized = body.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  /** @type {BodySection[]} */
  const sections = [];
  /** @type {string[]} */
  let currentLines = [];
  let currentHeading = null;

  const flush = () => {
    const sectionBody = currentLines.join("\n").trim();
    if (sectionBody || currentHeading) {
      sections.push({
        heading: currentHeading,
        body: sectionBody,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const match = HEADING_RE.exec(line);
    if (match) {
      flush();
      currentHeading = match[2].trim();
      continue;
    }
    currentLines.push(line);
  }

  flush();

  if (sections.length === 0 && normalized.trim()) {
    return [{ heading: null, body: normalized.trim() }];
  }

  return sections.filter(
    (section) => section.body.length > 0 || section.heading,
  );
}

/**
 * @param {string} body
 * @returns {string[]}
 */
function splitOversizedBodyByParagraphs(body) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  /** @type {string[]} */
  const chunks = [];
  /** @type {string[]} */
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }
    chunks.push(buffer.join("\n\n"));
    buffer = [];
  };

  for (const paragraph of paragraphs) {
    const candidate =
      buffer.length === 0
        ? paragraph
        : `${buffer.join("\n\n")}\n\n${paragraph}`;
    if (
      buffer.length > 0 &&
      estimateTokenCount(candidate) > MAX_CHUNK_ESTIMATED_TOKENS
    ) {
      flushBuffer();
      buffer.push(paragraph);
      if (estimateTokenCount(paragraph) > MAX_CHUNK_ESTIMATED_TOKENS) {
        flushBuffer();
        chunks.push(paragraph);
        buffer = [];
      }
      continue;
    }
    buffer.push(paragraph);
  }

  flushBuffer();
  return chunks;
}

/**
 * @typedef {object} OkfBodyChunk
 * @property {string} partKey Stable key for `unit_id` suffix (no `#`)
 * @property {string | null} sectionHeading
 * @property {string} body Markdown body for this chunk (no title)
 */

/**
 * @param {string} body
 * @returns {OkfBodyChunk[]}
 */
export function chunkOkfBody(body) {
  const sections = splitBodyIntoHeadingSections(body);
  if (sections.length === 0) {
    return [];
  }

  /** @type {OkfBodyChunk[]} */
  const rawParts = [];

  for (const section of sections) {
    const baseKey =
      section.heading === null ? "intro" : slugifyHeading(section.heading);

    const sectionBody = section.body.trim();
    if (!sectionBody && section.heading) {
      continue;
    }

    if (estimateTokenCount(sectionBody) <= MAX_CHUNK_ESTIMATED_TOKENS) {
      rawParts.push({
        partKey: baseKey,
        sectionHeading: section.heading,
        body: sectionBody,
      });
      continue;
    }

    const paragraphs = splitOversizedBodyByParagraphs(sectionBody);
    if (paragraphs.length <= 1) {
      rawParts.push({
        partKey: baseKey,
        sectionHeading: section.heading,
        body: sectionBody,
      });
      continue;
    }

    for (let index = 0; index < paragraphs.length; index += 1) {
      rawParts.push({
        partKey: `${baseKey}-p${index + 1}`,
        sectionHeading: section.heading,
        body: paragraphs[index],
      });
    }
  }

  if (rawParts.length === 0) {
    const trimmed = body.trim();
    if (!trimmed) {
      return [];
    }
    return [
      {
        partKey: "intro",
        sectionHeading: null,
        body: trimmed,
      },
    ];
  }

  const usedKeys = new Set();
  for (const part of rawParts) {
    let key = part.partKey;
    let suffix = 2;
    while (usedKeys.has(key)) {
      key = `${part.partKey}-${suffix}`;
      suffix += 1;
    }
    part.partKey = key;
    usedKeys.add(key);
  }

  return rawParts;
}

/**
 * @param {string} okfConceptId
 * @param {OkfBodyChunk[]} chunks
 * @returns {string}
 */
export function unitIdForChunk(okfConceptId, chunks, chunkIndex) {
  if (chunks.length === 1) {
    return `unit/${okfConceptId}`;
  }
  const partKey = chunks[chunkIndex].partKey;
  return `unit/${okfConceptId}#${partKey}`;
}

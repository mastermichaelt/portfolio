/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */

/**
 * @typedef {object} RetrievalSourceLike
 * @property {string} [resource]
 */

/**
 * @param {string} url
 * @returns {string | null}
 */
export function normalizeEvidenceUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    parsed.hash = "";
    return parsed.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function extractHttpUrlsFromText(text) {
  if (typeof text !== "string" || text === "") {
    return [];
  }

  const pattern = /https?:\/\/[^\s<>"')\]]+/gi;
  /** @type {string[]} */
  const found = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (const match of text.matchAll(pattern)) {
    const raw = match[0].replace(/[.,;:!?)]+$/, "");
    const normalized = normalizeEvidenceUrl(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      found.push(normalized);
    }
  }
  return found;
}

/**
 * @param {unknown} sources
 * @returns {string[]}
 */
function urlsFromSourcesJson(sources) {
  if (!Array.isArray(sources)) {
    return [];
  }

  /** @type {string[]} */
  const urls = [];
  for (const item of sources) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const resource = /** @type {RetrievalSourceLike} */ (item).resource;
    if (typeof resource === "string") {
      const normalized = normalizeEvidenceUrl(resource);
      if (normalized) {
        urls.push(normalized);
      }
    }
  }
  return urls;
}

/**
 * @param {EvidencePacket} packet
 * @returns {Set<string>}
 */
export function collectApprovedEvidenceUrls(packet) {
  /** @type {Set<string>} */
  const approved = new Set();

  for (const entry of packet.entries) {
    if (typeof entry.resource === "string") {
      const normalized = normalizeEvidenceUrl(entry.resource);
      if (normalized) {
        approved.add(normalized);
      }
    }

    for (const url of urlsFromSourcesJson(entry.sources)) {
      approved.add(url);
    }
  }

  return approved;
}

/**
 * @param {string} answerText
 * @param {Set<string>} approvedUrls
 * @returns {string[]}
 */
export function findUnapprovedUrlsInAnswer(answerText, approvedUrls) {
  const cited = extractHttpUrlsFromText(answerText);
  /** @type {string[]} */
  const unapproved = [];

  for (const url of cited) {
    if (!approvedUrls.has(url)) {
      unapproved.push(url);
    }
  }

  return unapproved;
}

/**
 * Retrieval unit shape derived from OKF concepts (in-memory / pre-persist).
 * One unit per OKF concept in the initial 1:1 mapping.
 */

/**
 * @typedef {"portfolio" | "repo" | "writing" | "about"} SourceClass
 */

/**
 * @typedef {object} RetrievalSource
 * @property {string} id
 * @property {string} title
 * @property {string} resource
 */

/**
 * @typedef {object} RetrievalUnit
 * @property {string} unit_id Stable deterministic id (`unit/{okf_concept_id}`)
 * @property {string} okf_concept_id OKF concept path without `.md`
 * @property {string} okf_version OKF bundle version (e.g. `0.2`)
 * @property {SourceClass} source_class Namespace prefix of the concept id
 * @property {string} type OKF frontmatter `type`
 * @property {string} title Human-readable title
 * @property {string} resource Canonical URL for the concept
 * @property {RetrievalSource[]} sources OKF provenance chain
 * @property {string[]} tags OKF tags for filtering
 * @property {string} text Embedding input (`{title}\n\n{body}`)
 * @property {string} content_hash SHA-256 hex digest of `text`
 * @property {Record<string, unknown>} metadata Filterable facets (e.g. `generated`)
 */

export {};

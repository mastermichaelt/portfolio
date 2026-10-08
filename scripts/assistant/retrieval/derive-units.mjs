#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { CORPUS_ROOT, OKF_VERSION } from "../okf/constants.mjs";
import { listConceptFiles, sha256String } from "../okf/manifest.mjs";

import { chunkOkfBody, unitIdForChunk } from "./chunk-okf-body.mjs";
import { readOkfConceptFile } from "./parse-okf-concept.mjs";

/** @typedef {import("./unit-schema.mjs").RetrievalUnit} RetrievalUnit */
/** @typedef {import("./unit-schema.mjs").SourceClass} SourceClass */

export const RETRIEVAL_UNITS_OUTPUT = "generated/retrieval-units.json";

/**
 * @param {string} okfConceptId
 * @returns {SourceClass}
 */
export function sourceClassFromConceptId(okfConceptId) {
  const prefix = okfConceptId.split("/")[0];
  if (
    prefix === "portfolio" ||
    prefix === "repo" ||
    prefix === "writing" ||
    prefix === "about"
  ) {
    return prefix;
  }
  throw new Error(`Unknown OKF namespace for concept id: ${okfConceptId}`);
}

/**
 * @param {string} title
 * @param {string} body
 */
export function composeRetrievalText(title, body) {
  const trimmedBody = body.trim();
  return trimmedBody ? `${title}\n\n${trimmedBody}` : title;
}

/**
 * Structure-aware 1:N derivation from one parsed OKF concept.
 *
 * @param {ReturnType<typeof readOkfConceptFile>} concept
 * @param {string} okfVersion
 * @returns {RetrievalUnit[]}
 */
export function deriveUnitsFromConcept(concept, okfVersion = OKF_VERSION) {
  const okfConceptId = concept.okf_concept_id.replace(/^generated\/okf\//, "");
  const bodyChunks = chunkOkfBody(concept.body);
  if (bodyChunks.length === 0) {
    throw new Error(
      `OKF concept produced zero retrieval units (refusing silent drop): ${okfConceptId}`,
    );
  }
  const chunkCount = bodyChunks.length;

  return bodyChunks.map((chunk, chunkIndex) => {
    const text = composeRetrievalText(concept.title, chunk.body);
    const sectionHeading = chunk.sectionHeading ?? undefined;

    return {
      unit_id: unitIdForChunk(okfConceptId, bodyChunks, chunkIndex),
      okf_concept_id: okfConceptId,
      okf_version: okfVersion,
      source_class: sourceClassFromConceptId(okfConceptId),
      type: concept.type,
      title: concept.title,
      resource: concept.resource,
      sources: concept.sources,
      tags: concept.tags,
      text,
      content_hash: sha256String(text),
      section_heading: sectionHeading,
      chunk_index: chunkCount > 1 ? chunkIndex : undefined,
      chunk_count: chunkCount > 1 ? chunkCount : undefined,
      metadata: {
        generated: concept.generated,
        section_heading: sectionHeading ?? null,
        chunk_index: chunkCount > 1 ? chunkIndex : null,
        chunk_count: chunkCount > 1 ? chunkCount : null,
        part_key: chunkCount > 1 ? chunk.partKey : null,
      },
    };
  });
}

/**
 * @deprecated Use deriveUnitsFromConcept — returns the first unit only (single-chunk concepts).
 * @param {ReturnType<typeof readOkfConceptFile>} concept
 * @param {string} okfVersion
 * @returns {RetrievalUnit}
 */
export function deriveUnitFromConcept(concept, okfVersion = OKF_VERSION) {
  const units = deriveUnitsFromConcept(concept, okfVersion);
  if (units.length !== 1) {
    throw new Error(
      `deriveUnitFromConcept expects a single-chunk concept, received ${units.length} chunks for ${units[0]?.okf_concept_id}`,
    );
  }
  return units[0];
}

/**
 * Read okf_version from manifest.json when present; fall back to OKF_VERSION.
 */
export function readOkfVersion(corpusRoot) {
  const manifestPath = path.join(corpusRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return OKF_VERSION;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return manifest.okf_version ?? OKF_VERSION;
}

/**
 * Derive retrieval units from an OKF corpus directory (structure-aware 1:N).
 *
 * @param {object} [options]
 * @param {string} [options.corpusRoot]
 * @returns {RetrievalUnit[]}
 */
export function deriveRetrievalUnits({ corpusRoot = CORPUS_ROOT } = {}) {
  const absoluteCorpusRoot = path.isAbsolute(corpusRoot)
    ? corpusRoot
    : path.join(process.cwd(), corpusRoot);
  const okfVersion = readOkfVersion(absoluteCorpusRoot);
  const conceptPaths = listConceptFiles(absoluteCorpusRoot);

  return conceptPaths
    .flatMap((relativePath) => {
      const okfConceptId = relativePath.replace(/\.md$/, "");
      const absolutePath = path.join(absoluteCorpusRoot, relativePath);
      const concept = readOkfConceptFile(absolutePath, okfConceptId);
      return deriveUnitsFromConcept(concept, okfVersion);
    })
    .sort((left, right) => left.unit_id.localeCompare(right.unit_id));
}

function parseArgs(argv) {
  const options = {
    corpusRoot: CORPUS_ROOT,
    write: false,
    outputPath: RETRIEVAL_UNITS_OUTPUT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") {
      options.write = true;
      continue;
    }
    if (arg === "--corpus" && argv[index + 1]) {
      options.corpusRoot = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--out" && argv[index + 1]) {
      options.outputPath = argv[index + 1];
      options.write = true;
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

export function printHelp() {
  console.log(`Usage: npm run assistant:derive [--write] [--corpus <path>] [--out <file>]

Derive stable retrieval units from an OKF corpus (default: ${CORPUS_ROOT}/).
Structure-aware 1:N chunking uses OKF markdown headings and paragraph safeguards.

Options:
  --write           Write JSON to ${RETRIEVAL_UNITS_OUTPUT} (gitignored under /generated/)
  --out <file>      Write JSON to a custom path (implies --write)
  --corpus <path>   OKF corpus root (default: ${CORPUS_ROOT})
  -h, --help        Show this help
`);
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const units = deriveRetrievalUnits({ corpusRoot: options.corpusRoot });
  const payload = JSON.stringify(units, null, 2);

  if (options.write) {
    const absoluteOutput = path.isAbsolute(options.outputPath)
      ? options.outputPath
      : path.join(process.cwd(), options.outputPath);
    fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
    fs.writeFileSync(absoluteOutput, `${payload}\n`, "utf8");
    console.log(
      `Derived ${units.length} retrieval units → ${path.relative(process.cwd(), absoluteOutput)}`,
    );
    return;
  }

  process.stdout.write(`${payload}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

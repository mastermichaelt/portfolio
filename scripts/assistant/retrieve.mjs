#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";

import { createPool, getDatabaseUrl } from "./db/client.mjs";
import { embedTexts } from "./embeddings/openai-embeddings.mjs";
import {
  PGVECTOR_COSINE_DISTANCE_OPERATOR,
  searchRetrievalUnits,
} from "./retrieve/search.mjs";

const DEFAULT_TOP_K = 5;

/**
 * @param {string[]} argv
 */
export function parseRetrieveArgs(argv) {
  /** @type {{ query: string[], topK: number, sourceClass?: string, json: boolean, help: boolean }} */
  const options = {
    query: [],
    topK: DEFAULT_TOP_K,
    sourceClass: undefined,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--top-k") {
      const value = argv[++i];
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(
          `--top-k requires a positive integer, received "${value}"`,
        );
      }
      options.topK = parsed;
      continue;
    }
    if (arg === "--filter-source-class") {
      const value = argv[++i]?.trim();
      if (!value) {
        throw new Error("--filter-source-class requires a value");
      }
      options.sourceClass = value;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    options.query.push(arg);
  }

  return options;
}

export function printHelp() {
  console.log(`Usage: npm run assistant:retrieve -- "<question>"

Embed the question (text-embedding-3-small), run exact pgvector cosine search, and print top-K hits.

Cosine distance uses pgvector operator ${PGVECTOR_COSINE_DISTANCE_OPERATOR} (lower = more similar).
OpenAI embeddings are unit-normalized; distance is typically in [0, 2].
Each hit includes similarity = 1 - cosine_distance (diagnostic only, not a probability).

Requires DATABASE_URL and OPENAI_API_KEY (portfolio-assistant project).

Options:
  --top-k <n>                 Number of hits (default ${DEFAULT_TOP_K})
  --filter-source-class <id>  Restrict to source_class (e.g. portfolio, about, career)
  --json                      Print JSON instead of a table
  -h, --help                  Show this help
`);
}

/**
 * @param {ReturnType<typeof searchRetrievalUnits> extends Promise<infer T> ? T : never} results
 */
export function formatResultsTable(results) {
  if (results.length === 0) {
    return "(no hits)";
  }

  const lines = [];
  for (const hit of results) {
    lines.push(
      `#${hit.rank}  distance=${hit.cosine_distance.toFixed(6)}  similarity=${hit.similarity.toFixed(6)}  ${hit.unit_id}`,
    );
    lines.push(`    ${hit.title}`);
    lines.push(`    ${hit.okf_concept_id} · ${hit.source_class}`);
  }
  return lines.join("\n");
}

/**
 * @param {{
 *   query: string,
 *   topK?: number,
 *   sourceClass?: string,
 *   json?: boolean,
 *   embedTexts?: typeof embedTexts,
 *   pool?: import("pg").Pool,
 *   databaseUrl?: string,
 *   log?: (message: string) => void,
 * }} options
 */
export async function runAssistantRetrieve(options) {
  const log = options.log ?? (() => {});
  const embedFn = options.embedTexts ?? embedTexts;
  const query = options.query.trim();
  if (!query) {
    throw new Error("Query text is required");
  }

  log(`Embedding query (${query.length} chars)…`);
  const [queryEmbedding] = await embedFn([query]);
  if (!queryEmbedding) {
    throw new Error("Embedding API returned no vector for the query");
  }

  const ownsPool = !options.pool;
  const pool =
    options.pool ?? createPool(options.databaseUrl ?? getDatabaseUrl());
  try {
    const results = await searchRetrievalUnits(pool, {
      queryEmbedding,
      topK: options.topK ?? DEFAULT_TOP_K,
      sourceClass: options.sourceClass,
    });

    const payload = {
      query,
      top_k: options.topK ?? DEFAULT_TOP_K,
      source_class_filter: options.sourceClass ?? null,
      distance_operator: PGVECTOR_COSINE_DISTANCE_OPERATOR,
      results,
    };

    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(formatResultsTable(results));
    }

    return payload;
  } finally {
    if (ownsPool) {
      await pool.end();
    }
  }
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseRetrieveArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const query = options.query.join(" ").trim();
  if (!query) {
    console.error("Error: provide a question string after --");
    printHelp();
    process.exit(1);
  }

  await runAssistantRetrieve({
    query,
    topK: options.topK,
    sourceClass: options.sourceClass,
    json: options.json,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

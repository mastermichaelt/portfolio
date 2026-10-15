#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";

import { ASSEMBLY_MODES } from "./generation/evidence-packet.mjs";
import {
  EvidenceBudgetExceeded,
  GenerationParseError,
  GenerationValidationError,
  QueryValidationError,
} from "./generation/errors.mjs";
import { DEFAULT_GENERATION_TOP_K } from "./generation/generation-config.mjs";
import { runRagGeneration } from "./generation/run-generation.mjs";

/**
 * @param {string[]} argv
 */
export function parseAnswerArgs(argv) {
  /** @type {{
   *   query: string[],
   *   assemblyMode: import("./generation/evidence-packet.mjs").AssemblyMode,
   *   topK: number,
   *   sourceClass?: string,
   *   json: boolean,
   *   dryRunRetrieval: boolean,
   *   noRetrieval: boolean,
   *   help: boolean,
   * }} */
  const options = {
    query: [],
    assemblyMode: "full_parent",
    topK: DEFAULT_GENERATION_TOP_K,
    sourceClass: undefined,
    json: false,
    dryRunRetrieval: false,
    noRetrieval: false,
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
    if (arg === "--dry-run-retrieval") {
      options.dryRunRetrieval = true;
      continue;
    }
    if (arg === "--no-retrieval") {
      options.noRetrieval = true;
      continue;
    }
    if (arg === "--assembly-mode") {
      const value = argv[++i];
      if (!value || !ASSEMBLY_MODES.includes(value)) {
        throw new Error(
          `--assembly-mode must be one of: ${ASSEMBLY_MODES.join(", ")}`,
        );
      }
      options.assemblyMode = value;
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
  console.log(`Usage: npm run assistant:answer -- "<question>"

Evidence-aware RAG generation over the assistant retrieval index (shared service; thin CLI adapter).

Requires DATABASE_URL and OPENAI_API_KEY unless --no-retrieval or --dry-run-retrieval (retrieval still needs DATABASE_URL unless --no-retrieval).

Options:
  --assembly-mode <mode>      full_parent (default) or top_k_only
  --top-k <n>                 Retrieval hits before assembly (default ${DEFAULT_GENERATION_TOP_K})
  --filter-source-class <id>  Restrict retrieval to source_class
  --no-retrieval              Skip retrieval (eval / model-only baseline)
  --dry-run-retrieval         Retrieve and assemble only; no OpenAI chat call
  --json                      Print JSON (full response or dry-run packet)
  -h, --help                  Show this help
`);
}

/**
 * @param {number} code
 * @param {unknown} error
 */
export function exitCodeForGenerationError(error) {
  if (
    error instanceof EvidenceBudgetExceeded ||
    error instanceof GenerationValidationError ||
    error instanceof GenerationParseError ||
    error instanceof QueryValidationError
  ) {
    return 1;
  }
  if (error instanceof Error && error.message.includes("OpenAI")) {
    return 1;
  }
  return 1;
}

/**
 * @param {string[]} [argv]
 */
export async function main(argv = process.argv.slice(2)) {
  const options = parseAnswerArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const question = options.query.join(" ").trim();
  if (!question) {
    console.error("Error: provide a question string after --");
    printHelp();
    process.exit(1);
  }

  const result = await runRagGeneration({
    question,
    assemblyMode: options.assemblyMode,
    topK: options.topK,
    sourceClass: options.sourceClass,
    noRetrieval: options.noRetrieval,
    dryRunRetrieval: options.dryRunRetrieval,
    executionContext: "cli",
  });

  await result.flushTelemetry();

  if (options.dryRunRetrieval) {
    const payload = {
      question,
      packet: result.packet,
      diagnostics: result.diagnostics,
    };
    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(
        `assembly_mode=${result.packet.assembly_mode} entries=${result.packet.entries.length} chars=${result.packet.character_count} truncated=${result.packet.truncated}`,
      );
    }
    return;
  }

  const response = result.response;
  if (!response) {
    throw new Error("Generation did not return a response");
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          ...response,
          diagnostics: result.diagnostics,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const claim of response.claims) {
    console.log(`[${claim.attribution}] ${claim.text}`);
    if (claim.citations?.length) {
      for (const citation of claim.citations) {
        console.log(`  ↳ ${citation.evidence_id} · ${citation.unit_id}`);
      }
    }
  }
  console.log("");
  console.log(
    `support_level=${response.support_level} abstained=${response.abstained}${
      response.abstention_reason ? ` reason=${response.abstention_reason}` : ""
    }`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exit(exitCodeForGenerationError(error));
  });
}

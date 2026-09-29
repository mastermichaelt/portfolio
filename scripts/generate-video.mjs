#!/usr/bin/env node
// Development-only text-to-video generator for portfolio visual experiments.
//
// This is occasional tooling for generating candidate motion assets — NOT a
// production feature. It is a standalone Node script that no `app/` code
// imports, so `@google/genai` (a devDependency) never enters the Next.js bundle
// or runtime, and the API key stays server-side only. See
// docs/video-generation.md.
//
// It mirrors the conventions of scripts/generate-image.mjs (env loading,
// disposable `generated/` output, dry-run pre-flight, argument parsing) but is a
// SEPARATE tool: video generation is asynchronous, materially more expensive,
// and its request/response shapes differ from image generation. All
// Google-specific generation code lives in this one file on purpose — to swap
// the generator later, replace `generateVideo()` and the SDK import here.
//
// Usage:
//   npm run generate:video -- --prompt "<text>" [--out <path>] \
//     [--model veo-3.1-lite-generate-preview] [--resolution 720p] \
//     [--aspect 16:9] [--duration 4] [--negative "<text>"] [--dry-run]
//
// Auth: reads GEMINI_API_KEY from the environment, or from .env.local / .env.
//
// Cost safety: video is billed per generated second. Defaults are the cheapest
// practical supported configuration (lite model, 720p, shortest duration). One
// invocation submits exactly one operation and produces at most one video; the
// tool never retries or regenerates. Expensive choices (higher-tier models,
// 1080p, longer durations) must be requested explicitly.

import { GoogleGenAI } from "@google/genai";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// --- Defaults and supported values (mirror the current Veo 3.1 Gemini API) ---
//
// Verified 2026-09-29 against the models available to a Gemini Developer API key
// (models.list -> veo-3.1-generate-preview, veo-3.1-fast-generate-preview,
// veo-3.1-lite-generate-preview) and the public Veo docs. The API remains the
// final authority on which model/resolution/duration combinations are valid;
// these lists only fail obvious typos fast with a helpful message.

const DEFAULT_MODEL = "veo-3.1-lite-generate-preview"; // cheapest available tier
const DEFAULT_OUTPUT_DIR = "generated"; // disposable, gitignored scratch area
const DEFAULT_RESOLUTION = "720p"; // cheapest supported resolution
const DEFAULT_ASPECT = "16:9";
const DEFAULT_DURATION_SECONDS = 4; // shortest supported clip

// Veo 3.1 tiers exposed on the Gemini Developer API. Ordered cheapest-first.
const SUPPORTED_MODELS = [
  "veo-3.1-lite-generate-preview",
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-preview",
];
// Veo 3.1 documents 16:9 (landscape) and 9:16 (portrait) only.
const SUPPORTED_ASPECT_RATIOS = ["16:9", "9:16"];
// This tool exposes 720p and 1080p. 1080p (and 4k on higher tiers) may require a
// longer duration depending on the model; the API is the authority on the combo.
const SUPPORTED_RESOLUTIONS = ["720p", "1080p"];
// Veo 3.1 documents 4, 6, and 8 second clips.
const SUPPORTED_DURATIONS = [4, 6, 8];

// Polling cadence for the long-running generation operation. Veo typically
// finishes in ~1-3 minutes; the ceiling stops us from waiting forever without
// ever resubmitting (which would be a second billable call).
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

// Approximate USD price per generated second, by model and resolution. Sourced
// from Google's public pricing on 2026-09-29 and used ONLY for a local estimate
// shown before/instead of a call — never authoritative. Google bills the real
// amount; confirm current pricing at https://ai.google.dev/gemini-api/docs/pricing.
const APPROX_PRICE_PER_SECOND_USD = {
  "veo-3.1-lite-generate-preview": { "720p": 0.05, "1080p": 0.08 },
  "veo-3.1-fast-generate-preview": { "720p": 0.1, "1080p": 0.12 },
  "veo-3.1-generate-preview": { "720p": 0.4, "1080p": 0.4 },
};

// --- Tiny argument parser (no dependency) ---

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

// --- Minimal .env loader (no dependency): .env.local then .env, never override ---

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const contents = fs.readFileSync(full, "utf8");
    for (const rawLine of contents.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

// --- Cost estimate (pure): approximate only, for pre-flight display ---

// Returns a number of USD, or null when pricing for the model/resolution is
// unknown (e.g. a --model override). Never used for a billing decision — only to
// show the caller a rough figure before a paid call.
export function estimateCostUsd(model, resolution, durationSeconds) {
  const perSecond = APPROX_PRICE_PER_SECOND_USD[model]?.[resolution];
  if (typeof perSecond !== "number") return null;
  return Math.round(perSecond * durationSeconds * 100) / 100;
}

// --- Container validation: confirm the bytes really are what was declared ---

// ISO Base Media File Format (MP4): a `ftyp` box at offset 4.
function isMp4(bytes) {
  return (
    bytes.length > 12 &&
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  );
}

// WebM/Matroska: EBML header magic.
function isWebm(bytes) {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  );
}

// The only video containers this tool knows how to name and verify. Each entry
// maps a MIME type to its canonical extension (plus accepted aliases so a
// user-supplied path is not needlessly rewritten) and a magic-byte sniffer.
export const SUPPORTED_VIDEO_TYPES = {
  "video/mp4": {
    label: "MP4",
    ext: ".mp4",
    extAliases: [".mp4", ".m4v"],
    sniff: isMp4,
  },
  "video/webm": {
    label: "WebM",
    ext: ".webm",
    extAliases: [".webm"],
    sniff: isWebm,
  },
};

// Resolve the metadata for a declared MIME type WITHOUT any I/O, so the output
// path can be corrected before the (potentially large) download is written.
// Throws on an unsupported type. Veo returns MP4; an unset mimeType is treated
// as MP4 and confirmed by the post-download byte sniff.
export function resolveVideoType(mimeType) {
  const key = mimeType || "video/mp4";
  const type = SUPPORTED_VIDEO_TYPES[key];
  if (!type) {
    throw new Error(
      `Unsupported video type "${mimeType}". Supported: ${Object.keys(
        SUPPORTED_VIDEO_TYPES,
      ).join(", ")}.`,
    );
  }
  return { mimeType: key, ...type };
}

// Resolve the path to write to: keep the caller's path when its extension
// already fits the container, otherwise swap in the canonical extension for the
// bytes we actually got. Pure (no I/O) so it is easy to test.
export function resolveOutputPath(outPath, info) {
  const currentExt = path.extname(outPath).toLowerCase();
  if (info.extAliases.includes(currentExt)) return outPath;
  const base = currentExt
    ? outPath.slice(0, outPath.length - currentExt.length)
    : outPath;
  return `${base}${info.ext}`;
}

// Confirm a downloaded file on disk is a non-empty, valid container of the
// declared type. Reads only the header. Throws (leaving the disposable file in
// place for inspection) so a mislabeled or truncated download is never reported
// as a success.
export function verifyVideoFile(filePath, info, deps = {}) {
  const statSync = deps.statSync ?? fs.statSync;
  const openSync = deps.openSync ?? fs.openSync;
  const readSync = deps.readSync ?? fs.readSync;
  const closeSync = deps.closeSync ?? fs.closeSync;

  const { size } = statSync(filePath);
  if (size === 0) throw new Error("Downloaded video file is empty.");

  const header = Buffer.alloc(32);
  const fd = openSync(filePath, "r");
  let read = 0;
  try {
    read = readSync(fd, header, 0, header.length, 0);
  } finally {
    closeSync(fd);
  }

  if (!info.sniff(header.subarray(0, read))) {
    throw new Error(
      `Downloaded file is not a valid ${info.mimeType} (${info.label}) container.`,
    );
  }

  return { bytes: size, format: info.label, mimeType: info.mimeType };
}

// --- The one Google-specific unit: prompt -> generated video reference ---
//
// Submits a single generation operation, then polls THE SAME operation until it
// completes. Never resubmits (a resubmit would be a second billable call) and
// never requests more than one video. Returns the generated video reference
// (which carries the download URI and mimeType); downloading is done by the
// caller via the same client so the auth context is shared.

async function generateVideo({
  apiKey,
  model,
  prompt,
  aspectRatio,
  resolution,
  durationSeconds,
  negativePrompt,
  onProgress,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const ai = new GoogleGenAI({ apiKey });

  const config = {
    numberOfVideos: 1,
    aspectRatio,
    resolution,
    durationSeconds,
  };
  if (negativePrompt) config.negativePrompt = negativePrompt;

  // Pass the prompt via `source` rather than the deprecated top-level `prompt`
  // argument (the SDK warns the latter will be removed in a future major).
  let operation = await ai.models.generateVideos({
    model,
    source: { prompt },
    config,
  });

  const startedAt = now();
  while (!operation.done) {
    if (now() - startedAt > POLL_TIMEOUT_MS) {
      throw new Error(
        `Video generation did not complete within ${Math.round(
          POLL_TIMEOUT_MS / 60_000,
        )} minutes (operation ${operation.name ?? "unknown"}). Not resubmitting.`,
      );
    }
    if (onProgress) {
      onProgress(Math.round((now() - startedAt) / 1000));
    }
    await sleep(POLL_INTERVAL_MS);
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (operation.error) {
    const message =
      operation.error.message ?? JSON.stringify(operation.error) ?? "unknown";
    throw new Error(`Video generation failed: ${message}`);
  }

  const generated = operation.response?.generatedVideos ?? [];
  const video = generated[0]?.video;
  if (!video) {
    const filtered = operation.response?.raiMediaFilteredReasons?.join("; ");
    const detail = filtered
      ? `content was filtered: ${filtered}`
      : "no video returned by the operation";
    throw new Error(`Model returned no video. Detail: ${detail}`);
  }

  return {
    video,
    mimeType: video.mimeType,
    // Bound to the same client so its auth context is reused for the download.
    download: (downloadPath) =>
      ai.files.download({ file: video, downloadPath }),
  };
}

// --- CLI ---

const HELP_TEXT = [
  "Generate a portfolio video with Veo 3.1 (text-to-video, dev tooling only).",
  "",
  "Usage:",
  '  npm run generate:video -- --prompt "<text>" [options]',
  "",
  "Options:",
  "  --prompt <text>     Required. What to generate.",
  `  --out <path>        Output file. Default: ${DEFAULT_OUTPUT_DIR}/<timestamp>.mp4`,
  `  --model <id>        ${SUPPORTED_MODELS.join(", ")}`,
  `                      (default ${DEFAULT_MODEL} — the cheapest tier)`,
  `  --resolution <res>  ${SUPPORTED_RESOLUTIONS.join(", ")} (default ${DEFAULT_RESOLUTION})`,
  `  --aspect <ratio>    ${SUPPORTED_ASPECT_RATIOS.join(", ")} (default ${DEFAULT_ASPECT})`,
  `  --duration <secs>   ${SUPPORTED_DURATIONS.join(", ")} (default ${DEFAULT_DURATION_SECONDS})`,
  "  --negative <text>   Optional. What to avoid in the video.",
  "  --dry-run           Resolve and print the request; no network call, no file.",
  "",
  "Cost: Veo is billed per generated second and is much more expensive than",
  "images. One run submits one operation and produces at most one video; the",
  "tool never retries. Veo 3.1 always generates audio (it cannot be disabled).",
  "",
  "Auth: GEMINI_API_KEY from the environment or .env.local / .env.",
  "",
].join("\n");

// Resolve and validate every CLI input WITHOUT any network or filesystem
// access. Throws on invalid input. `hasApiKey` and `dryRun` let the caller
// decide whether to actually generate; this function never itself reaches the
// billable boundary, which keeps the pre-flight cheap to unit-test.
export function resolveRequest(args, env) {
  const prompt = typeof args.prompt === "string" ? args.prompt : "";
  if (!prompt) {
    throw new Error('Missing --prompt. Try: --prompt "a red circle moving".');
  }

  const model = typeof args.model === "string" ? args.model : DEFAULT_MODEL;
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error(
      `Unsupported --model "${model}". Supported: ${SUPPORTED_MODELS.join(", ")}.`,
    );
  }

  const resolution =
    typeof args.resolution === "string" ? args.resolution : DEFAULT_RESOLUTION;
  if (!SUPPORTED_RESOLUTIONS.includes(resolution)) {
    throw new Error(
      `Unsupported --resolution "${resolution}". Supported: ${SUPPORTED_RESOLUTIONS.join(", ")}.`,
    );
  }

  const aspectRatio =
    typeof args.aspect === "string" ? args.aspect : DEFAULT_ASPECT;
  if (!SUPPORTED_ASPECT_RATIOS.includes(aspectRatio)) {
    throw new Error(
      `Unsupported --aspect "${aspectRatio}". Supported: ${SUPPORTED_ASPECT_RATIOS.join(", ")}.`,
    );
  }

  const durationSeconds =
    args.duration === undefined
      ? DEFAULT_DURATION_SECONDS
      : Number(args.duration);
  if (!SUPPORTED_DURATIONS.includes(durationSeconds)) {
    throw new Error(
      `Unsupported --duration "${args.duration}". Supported (seconds): ${SUPPORTED_DURATIONS.join(", ")}.`,
    );
  }

  const negativePrompt = typeof args.negative === "string" ? args.negative : "";

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath =
    typeof args.out === "string"
      ? args.out
      : path.join(DEFAULT_OUTPUT_DIR, `${timestamp}.mp4`);

  return {
    prompt,
    model,
    resolution,
    aspectRatio,
    durationSeconds,
    negativePrompt,
    outPath,
    dryRun: Boolean(args["dry-run"]),
    hasApiKey: Boolean(env.GEMINI_API_KEY),
    estimatedCostUsd: estimateCostUsd(model, resolution, durationSeconds),
  };
}

const MISSING_KEY_MESSAGE = [
  "GEMINI_API_KEY is not set, so no video can be generated.",
  "",
  "Provide it in one of these ways (never commit it):",
  "  1. Add a line to .env.local at the repo root:  GEMINI_API_KEY=your-key",
  "  2. Or export it for one command:  GEMINI_API_KEY=your-key npm run generate:video -- ...",
  "",
  "Get a key from Google AI Studio: https://aistudio.google.com/apikey",
  "",
].join("\n");

function formatCost(estimatedCostUsd) {
  return estimatedCostUsd === null
    ? "unknown (check current Google pricing)"
    : `~$${estimatedCostUsd.toFixed(2)} (approx; audio always included)`;
}

function buildSummary(request) {
  const lines = [
    "  model:      " + request.model,
    "  resolution: " + request.resolution,
    "  aspect:     " + request.aspectRatio,
    "  duration:   " + request.durationSeconds + "s (audio always on)",
    "  output:     " + request.outPath,
    "  est. cost:  " + formatCost(request.estimatedCostUsd),
    "  API key:    " + (request.hasApiKey ? "found" : "not found"),
    "  prompt:     " + request.prompt,
  ];
  if (request.negativePrompt) {
    lines.push("  negative:   " + request.negativePrompt);
  }
  return lines;
}

// `deps` exists only for testability: it injects the environment and the
// generate function so a test can prove --dry-run never reaches generation.
// Production callers pass nothing and get the real process env + SDK.
export async function main(argv, deps = {}) {
  const generate = deps.generate ?? generateVideo;
  const stdout = deps.stdout ?? process.stdout;
  const stderr = deps.stderr ?? process.stderr;
  // Only load .env.* into the real process env when no env was injected, so
  // tests neither read the developer's real .env.local nor mutate globals.
  if (!deps.env) loadEnvFiles();
  const env = deps.env ?? process.env;

  const args = parseArgs(argv ?? process.argv.slice(2));

  if (args.help || args.h) {
    stdout.write(HELP_TEXT);
    return;
  }

  const request = resolveRequest(args, env);
  const summary = buildSummary(request);

  // Dry run: stop here, before generateVideo() or any file/network work.
  if (request.dryRun) {
    stdout.write(
      [
        "Dry run — resolved request (no video generated, no network call):",
        ...summary,
        "",
      ].join("\n"),
    );
    return;
  }

  if (!request.hasApiKey) {
    stderr.write(MISSING_KEY_MESSAGE);
    process.exitCode = 1;
    return;
  }

  stdout.write(
    [
      `Generating one ${request.durationSeconds}s ${request.resolution} video with ${request.model}...`,
      `Estimated cost: ${formatCost(request.estimatedCostUsd)}`,
      "Submitting operation and polling (this usually takes 1-3 minutes)...",
      "",
    ].join("\n"),
  );

  const { mimeType, download } = await generate({
    apiKey: env.GEMINI_API_KEY,
    model: request.model,
    prompt: request.prompt,
    aspectRatio: request.aspectRatio,
    resolution: request.resolution,
    durationSeconds: request.durationSeconds,
    negativePrompt: request.negativePrompt,
    onProgress: (elapsedSeconds) =>
      stdout.write(`  ...still generating (${elapsedSeconds}s elapsed)\n`),
  });

  // The API decides the container; name the file after what it actually
  // returned rather than the requested extension, mirroring the image tool.
  const info = resolveVideoType(mimeType);
  const finalPath = resolveOutputPath(request.outPath, info);
  if (finalPath !== request.outPath) {
    stdout.write(
      `Note: model returned ${info.mimeType}; saving as ${finalPath} instead of ${request.outPath}.\n`,
    );
  }

  fs.mkdirSync(path.dirname(path.resolve(finalPath)), { recursive: true });
  await download(finalPath);

  // Confirm the bytes on disk really are the declared container before
  // reporting success.
  const verified = verifyVideoFile(finalPath, info);
  stdout.write(
    `Saved ${finalPath} (${verified.format}, ${verified.mimeType}, ${verified.bytes} bytes)\n`,
  );
}

// Run only when invoked directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`Video generation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

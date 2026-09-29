#!/usr/bin/env node
// Development-only image generator for portfolio visual experiments.
//
// This is occasional tooling for generating candidate assets — NOT a production
// feature. It is a standalone Node script that no `app/` code imports, so
// `@google/genai` (a devDependency) never enters the Next.js bundle or runtime,
// and the API key stays server-side only. See docs/image-generation.md.
//
// All Google-specific generation code lives in this one file on purpose: to
// swap the generator later, replace `generateImage()` and the SDK import here.
//
// Usage:
//   npm run generate:image -- --prompt "<text>" [--out <path>] \
//     [--aspect 1:1] [--size 2K] [--model gemini-3-pro-image]
//
// Auth: reads GEMINI_API_KEY from the environment, or from .env.local / .env.

import { GoogleGenAI } from "@google/genai";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// --- Defaults and supported values (mirror the current Gemini 3 Pro Image API) ---

const DEFAULT_MODEL = "gemini-3-pro-image"; // Nano Banana Pro
const DEFAULT_OUTPUT_DIR = "generated"; // disposable, gitignored scratch area
const DEFAULT_ASPECT = "1:1";
const DEFAULT_SIZE = "2K";

// Documented by @google/genai ImageConfig at the pinned version. Validated here
// so a typo fails fast with a helpful message instead of a raw API error.
const SUPPORTED_ASPECT_RATIOS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
];
const SUPPORTED_SIZES = ["1K", "2K", "4K"];

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

// --- Image validation: confirm the returned bytes really are what was declared ---

function isPng(bytes) {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function isJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

// The only image formats this tool knows how to name and verify. Each entry
// maps a MIME type to its canonical extension (plus accepted aliases so a
// user-supplied path is not needlessly rewritten) and a magic-byte sniffer.
export const SUPPORTED_IMAGE_TYPES = {
  "image/png": {
    label: "PNG",
    ext: ".png",
    extAliases: [".png"],
    sniff: isPng,
  },
  "image/jpeg": {
    label: "JPEG",
    ext: ".jpg",
    extAliases: [".jpg", ".jpeg"],
    sniff: isJpeg,
  },
};

// Validate the in-memory bytes BEFORE anything touches the filesystem. Throws on
// an empty buffer, an unsupported MIME type, or bytes that contradict the
// declared type, so an unsupported or inconsistent format never leaves a
// mislabeled (or partial) file behind.
export function inspectImageBuffer(buffer, mimeType) {
  if (buffer.length === 0) throw new Error("Model returned an empty image.");

  const type = SUPPORTED_IMAGE_TYPES[mimeType];
  if (!type) {
    throw new Error(
      `Unsupported image type "${mimeType}". Supported: ${Object.keys(
        SUPPORTED_IMAGE_TYPES,
      ).join(", ")}.`,
    );
  }
  if (!type.sniff(buffer)) {
    throw new Error(
      `Model reported ${mimeType}, but the bytes are not a valid ${mimeType} image.`,
    );
  }

  const result = {
    format: type.label,
    ext: type.ext,
    extAliases: type.extAliases,
    bytes: buffer.length,
    width: null,
    height: null,
  };

  // PNG stores width/height as big-endian uint32 in the IHDR chunk.
  if (mimeType === "image/png" && buffer.length >= 24) {
    result.width = buffer.readUInt32BE(16);
    result.height = buffer.readUInt32BE(20);
  }

  return result;
}

// Resolve the path to write to: keep the caller's path when its extension
// already fits the format, otherwise swap in the canonical extension for the
// bytes we actually got. Pure (no I/O) so it is easy to test.
export function resolveOutputPath(outPath, info) {
  const currentExt = path.extname(outPath).toLowerCase();
  if (info.extAliases.includes(currentExt)) return outPath;
  const base = currentExt
    ? outPath.slice(0, outPath.length - currentExt.length)
    : outPath;
  return `${base}${info.ext}`;
}

// --- The one Google-specific unit: prompt -> image bytes ---

async function generateImage({
  apiKey,
  model,
  prompt,
  aspectRatio,
  imageSize,
}) {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio, imageSize },
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part?.inlineData?.data);

  if (!imagePart) {
    const text = parts
      .map((part) => part?.text)
      .filter(Boolean)
      .join(" ")
      .trim();
    const finish = response?.candidates?.[0]?.finishReason;
    const detail = text || finish || "no image and no explanation returned";
    throw new Error(`Model returned no image. Detail: ${detail}`);
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
  };
}

// --- CLI ---

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    process.stdout.write(
      [
        "Generate a portfolio image with Nano Banana Pro (Gemini 3 Pro Image).",
        "",
        "Usage:",
        '  npm run generate:image -- --prompt "<text>" [options]',
        "",
        "Options:",
        "  --prompt <text>   Required. What to generate.",
        `  --out <path>      Output file. Default: ${DEFAULT_OUTPUT_DIR}/<timestamp>.png`,
        `  --aspect <ratio>  ${SUPPORTED_ASPECT_RATIOS.join(", ")} (default ${DEFAULT_ASPECT})`,
        `  --size <res>      ${SUPPORTED_SIZES.join(", ")} (default ${DEFAULT_SIZE})`,
        `  --model <id>      Default ${DEFAULT_MODEL}`,
        "",
        "Auth: GEMINI_API_KEY from the environment or .env.local / .env.",
        "",
      ].join("\n"),
    );
    return;
  }

  const prompt = typeof args.prompt === "string" ? args.prompt : "";
  if (!prompt) {
    throw new Error('Missing --prompt. Try: --prompt "a red circle".');
  }

  const aspectRatio =
    typeof args.aspect === "string" ? args.aspect : DEFAULT_ASPECT;
  if (!SUPPORTED_ASPECT_RATIOS.includes(aspectRatio)) {
    throw new Error(
      `Unsupported --aspect "${aspectRatio}". Supported: ${SUPPORTED_ASPECT_RATIOS.join(", ")}.`,
    );
  }

  const imageSize = typeof args.size === "string" ? args.size : DEFAULT_SIZE;
  if (!SUPPORTED_SIZES.includes(imageSize)) {
    throw new Error(
      `Unsupported --size "${imageSize}". Supported: ${SUPPORTED_SIZES.join(", ")}.`,
    );
  }

  const model = typeof args.model === "string" ? args.model : DEFAULT_MODEL;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  let outPath =
    typeof args.out === "string"
      ? args.out
      : path.join(DEFAULT_OUTPUT_DIR, `${timestamp}.png`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      [
        "GEMINI_API_KEY is not set, so no image can be generated.",
        "",
        "Provide it in one of these ways (never commit it):",
        "  1. Add a line to .env.local at the repo root:  GEMINI_API_KEY=your-key",
        "  2. Or export it for one command:  GEMINI_API_KEY=your-key npm run generate:image -- ...",
        "",
        "Get a key from Google AI Studio: https://aistudio.google.com/apikey",
        "",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Generating ${imageSize} ${aspectRatio} image with ${model}...\n`,
  );

  const { buffer, mimeType } = await generateImage({
    apiKey,
    model,
    prompt,
    aspectRatio,
    imageSize,
  });

  // Validate the returned bytes in memory first; this throws for an empty,
  // unsupported, or inconsistent response before any file or directory is
  // created. The Gemini API decides the output format (it does not honor a
  // requested MIME type), so resolveOutputPath then names the file after the
  // bytes we actually got rather than the requested extension.
  const info = inspectImageBuffer(buffer, mimeType);
  const finalPath = resolveOutputPath(outPath, info);
  if (finalPath !== outPath) {
    process.stdout.write(
      `Note: model returned ${mimeType}; saving as ${finalPath} instead of ${outPath}.\n`,
    );
    outPath = finalPath;
  }

  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, buffer);

  const dims =
    info.width && info.height ? `, ${info.width}x${info.height}px` : "";
  process.stdout.write(
    `Saved ${outPath} (${info.format}, ${mimeType}, ${info.bytes} bytes${dims})\n`,
  );
}

// Run only when invoked directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`Image generation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

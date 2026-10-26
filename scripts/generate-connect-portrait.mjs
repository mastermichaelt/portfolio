#!/usr/bin/env node
/**
 * Write public/connect-portrait.jpg (600×600) from connect-portrait-source.jpg.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { extractConnectPortraitSquare } from "./lib/connect-portrait-crop.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public");
const source = resolve(publicDir, "connect-portrait-source.jpg");
const output = resolve(publicDir, "connect-portrait.jpg");

if (!existsSync(source)) {
  throw new Error(
    `Missing ${source} — add connect-portrait-source.jpg before running generate:connect-portrait`,
  );
}

const square = await extractConnectPortraitSquare(sharp, source);
await square
  .resize(600, 600)
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(output);

console.log(`Wrote ${output}`);

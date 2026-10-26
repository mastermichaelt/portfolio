#!/usr/bin/env node
/**
 * Write connect launcher icons from the same square crop as connect-portrait.jpg.
 */
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  composeConnectMaskableIconPreview,
  extractConnectPortraitSquare,
} from "./lib/connect-portrait-crop.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public");
const agentRunsDir = resolve(repoRoot, ".agent-runs");
const source = resolve(publicDir, "connect-portrait-source.jpg");
const out192 = resolve(publicDir, "connect-icon-192.png");
const out512 = resolve(publicDir, "connect-icon-512.png");
const previewMaskable512 = resolve(
  agentRunsDir,
  "connect-icon-maskable-512-preview.png",
);

if (!existsSync(source)) {
  throw new Error(
    `Missing ${source} — add connect-portrait-source.jpg before running generate:connect-icons`,
  );
}

const square = await extractConnectPortraitSquare(sharp, source);
const master512 = await square.resize(512, 512).png().toBuffer();

await sharp(master512).toFile(out512);
await sharp(master512).resize(192, 192).png().toFile(out192);

mkdirSync(agentRunsDir, { recursive: true });
await composeConnectMaskableIconPreview(sharp, sharp(out512), 512)
  .png()
  .toFile(previewMaskable512);

console.log(`Wrote ${out192}`);
console.log(`Wrote ${out512}`);
console.log(`Wrote ${previewMaskable512}`);

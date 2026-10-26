#!/usr/bin/env node
/**
 * Square connect portrait for the circular on-page frame (LinkedIn QR card framing).
 * Deliberate square crop on the source photo — not full-frame letterboxing.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

/**
 * Framing tuned on connect-portrait-source.jpg (768×1024): face + owl fill the
 * circle with minimal headroom; both subjects stay inside the crop.
 */
const FRAMING = {
  top: 330 / 1024,
  sideOfWidth: 665 / 768,
};

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public");
const source = resolve(publicDir, "connect-portrait-source.jpg");
const fallbackSource = resolve(publicDir, "portrait-michael-1200.jpg");
const master = resolve(publicDir, "connect-portrait-1200.jpg");

const input = existsSync(source) ? source : fallbackSource;

async function squareCropBuffer(inputPath) {
  const meta = await sharp(inputPath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error(`Could not read dimensions for ${inputPath}`);
  }

  const side = Math.min(Math.round(width * FRAMING.sideOfWidth), width, height);
  const top = Math.min(Math.round(height * FRAMING.top), height - side);
  const left = Math.max(0, Math.round((width - side) / 2));

  return sharp(inputPath)
    .extract({ left, top, width: side, height: side })
    .resize(1200, 1200)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

const squareMaster = await squareCropBuffer(input);

await sharp(squareMaster).toFile(master);

const variants = [
  { path: "connect-portrait.jpg", size: 600 },
  { path: "connect-portrait-400.jpg", size: 400 },
  { path: "connect-portrait-600.jpg", size: 600 },
  { path: "connect-portrait-900.jpg", size: 900 },
];

for (const { path, size } of variants) {
  await sharp(master)
    .resize(size, size)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(resolve(publicDir, path));
}

console.log(`Wrote ${master} from ${input}`);
for (const { path } of variants) {
  console.log(`Wrote public/${path}`);
}

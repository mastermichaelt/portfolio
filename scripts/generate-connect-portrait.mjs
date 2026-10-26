#!/usr/bin/env node
/**
 * Square connect portrait for the circular on-page frame (LinkedIn QR card framing).
 * Crop derived from the official LinkedIn QR reference circle, not centre-fit guessing.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

/**
 * Square extract on connect-portrait-source.jpg (768×1024).
 * Tuned against the portrait circle on the LinkedIn QR card reference (900×835).
 */
const SOURCE_CROP_BASE = {
  width: 768,
  height: 1024,
  left: 102,
  top: 246,
  size: 572,
};

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public");
const source = resolve(publicDir, "connect-portrait-source.jpg");
const fallbackSource = resolve(publicDir, "portrait-michael-1200.jpg");
const master = resolve(publicDir, "connect-portrait-1200.jpg");

const input = existsSync(source) ? source : fallbackSource;

function squareCropRegion(width, height) {
  const scaleX = width / SOURCE_CROP_BASE.width;
  const scaleY = height / SOURCE_CROP_BASE.height;
  const size = Math.min(
    Math.round(SOURCE_CROP_BASE.size * scaleX),
    width,
    height,
  );
  const left = Math.min(
    Math.round(SOURCE_CROP_BASE.left * scaleX),
    width - size,
  );
  const top = Math.min(
    Math.round(SOURCE_CROP_BASE.top * scaleY),
    height - size,
  );
  return { left, top, width: size, height: size };
}

async function squareCropBuffer(inputPath) {
  const meta = await sharp(inputPath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error(`Could not read dimensions for ${inputPath}`);
  }

  const region = squareCropRegion(width, height);

  return sharp(inputPath)
    .extract(region)
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

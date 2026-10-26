#!/usr/bin/env node
/**
 * Square connect portrait for the circular on-page frame (LinkedIn card composition).
 * Fits the full 4:5 photograph inside a square without cropping face or owl.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

/** Matches .connect-portrait border; pads letterboxing in the square master. */
const LETTERBOX = "#e8e4dc";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public");
const source = resolve(publicDir, "portrait-michael-1200.jpg");
const master = resolve(publicDir, "connect-portrait-1200.jpg");

const squareMaster = await sharp(source)
  .resize(1200, 1200, {
    fit: "contain",
    background: LETTERBOX,
  })
  .jpeg({ quality: 88, mozjpeg: true })
  .toBuffer();

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

console.log(`Wrote ${master}`);
for (const { path } of variants) {
  console.log(`Wrote public/${path}`);
}

#!/usr/bin/env node
/**
 * Write connect Home Screen launcher icons:
 * - 192px from the pixel-art brand master (android-chrome-192x192.png)
 * - 512px center-cropped from portrait-michael-1200.jpg (native resolution)
 */
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(repoRoot, "public");

const master192 = resolve(publicDir, "android-chrome-192x192.png");
const portrait = resolve(publicDir, "portrait-michael-1200.jpg");
const out192 = resolve(publicDir, "connect-icon-192.png");
const out512 = resolve(publicDir, "connect-icon-512.png");

await copyFile(master192, out192);

const portraitMeta = await sharp(portrait).metadata();
const side = Math.min(portraitMeta.width ?? 0, portraitMeta.height ?? 0);
if (side < 512) {
  throw new Error(
    `Expected portrait at least 512px on the short edge; got ${side}`,
  );
}

await sharp(portrait)
  .resize(side, side, {
    fit: "cover",
    position: "centre",
  })
  .resize(512, 512)
  .png()
  .toFile(out512);

console.log(`Wrote ${out192}`);
console.log(`Wrote ${out512}`);

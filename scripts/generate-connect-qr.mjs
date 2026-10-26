#!/usr/bin/env node
/**
 * Generate public/linkedin-connect-qr.svg from the canonical LinkedIn profile URL.
 * Optional: --verify-jpg <path> decodes a LinkedIn export card and asserts the
 * same profile (query params such as fromQR=1 are ignored).
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import jsQR from "jsqr";
import QRCode from "qrcode";
import sharp from "sharp";

import { LINKEDIN_PROFILE_URL } from "../lib/connect.ts";
import { linkedInProfileUrlsMatch } from "../lib/connect-qr-decode.ts";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = resolve(repoRoot, "public/linkedin-connect-qr.svg");

async function decodeQrFromImageFile(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const code = jsQR(
    new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    info.width,
    info.height,
  );
  return code?.data ?? null;
}

async function verifyJpg(jpgPath) {
  const decoded = await decodeQrFromImageFile(jpgPath);
  if (!decoded) {
    throw new Error(`No QR code found in ${jpgPath}`);
  }
  if (!linkedInProfileUrlsMatch(decoded, LINKEDIN_PROFILE_URL)) {
    throw new Error(
      `LinkedIn export QR does not match canonical profile.\n  decoded: ${decoded}\n  expected profile: ${LINKEDIN_PROFILE_URL}`,
    );
  }
  console.log(`Verified LinkedIn export QR → ${decoded}`);
}

async function writeSvg() {
  const svg = await QRCode.toString(LINKEDIN_PROFILE_URL, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  });
  await writeFile(outputPath, svg, "utf8");
  console.log(`Wrote ${outputPath}`);
}

function parseArgs(argv) {
  const verifyIndex = argv.indexOf("--verify-jpg");
  if (verifyIndex === -1) {
    return { verifyJpg: null };
  }
  const jpgPath = argv[verifyIndex + 1];
  if (!jpgPath) {
    throw new Error("--verify-jpg requires a file path");
  }
  return { verifyJpg: resolve(jpgPath) };
}

const { verifyJpg: jpgToVerify } = parseArgs(process.argv.slice(2));

if (jpgToVerify) {
  await verifyJpg(jpgToVerify);
}

await writeSvg();

const written = await readFile(outputPath, "utf8");
if (!written.includes("<svg")) {
  throw new Error("Generated connect QR SVG is invalid");
}

const roundTrip = await decodeQrFromImageFile(
  await sharp(outputPath).png().toBuffer(),
);
if (roundTrip !== LINKEDIN_PROFILE_URL) {
  throw new Error(
    `Round-trip decode failed.\n  got: ${roundTrip}\n  expected: ${LINKEDIN_PROFILE_URL}`,
  );
}

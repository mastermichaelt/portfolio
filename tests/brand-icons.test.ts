import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BRAND_ICONS = [
  { file: "public/favicon-32x32.png", width: 32, height: 32, minBytes: 200 },
  {
    file: "public/apple-touch-icon.png",
    width: 180,
    height: 180,
    minBytes: 4_000,
  },
  {
    file: "public/android-chrome-192x192.png",
    width: 192,
    height: 192,
    minBytes: 4_000,
  },
] as const;

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  expect(buffer.length).toBeGreaterThanOrEqual(24);
  expect(buffer.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe("brand icon assets", () => {
  it("ships exactly three PNG icons at 32, 180, and 192 pixels", () => {
    expect(BRAND_ICONS).toHaveLength(3);

    for (const icon of BRAND_ICONS) {
      const absolutePath = resolve(root, icon.file);
      const buffer = readFileSync(absolutePath);
      const { width, height } = readPngDimensions(buffer);
      const { size } = statSync(absolutePath);

      expect(width).toBe(icon.width);
      expect(height).toBe(icon.height);
      expect(size).toBeGreaterThan(icon.minBytes);
    }
  });
});

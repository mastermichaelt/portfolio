import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readJpegDimensions(buffer: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  throw new Error("Could not read JPEG dimensions");
}

describe("connect portrait asset", () => {
  it("ships square JPEGs generated for the circular frame", () => {
    for (const file of [
      "public/connect-portrait.jpg",
      "public/connect-portrait-1200.jpg",
    ]) {
      const absolutePath = resolve(root, file);
      expect(existsSync(absolutePath)).toBe(true);
      const { width, height } = readJpegDimensions(readFileSync(absolutePath));
      expect(width).toBe(height);
      expect(width).toBeGreaterThanOrEqual(600);
    }
  });
});

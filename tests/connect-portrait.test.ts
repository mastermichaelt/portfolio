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
  it("ships connect-portrait-source.jpg and a single 600×600 connect-portrait.jpg", () => {
    const sourcePath = resolve(root, "public/connect-portrait-source.jpg");
    const portraitPath = resolve(root, "public/connect-portrait.jpg");

    expect(existsSync(sourcePath)).toBe(true);
    expect(existsSync(portraitPath)).toBe(true);

    const { width, height } = readJpegDimensions(readFileSync(portraitPath));
    expect(width).toBe(600);
    expect(height).toBe(600);
  });
});

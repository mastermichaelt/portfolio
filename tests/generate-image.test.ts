import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";

import {
  SUPPORTED_IMAGE_TYPES,
  inspectImageBuffer,
  resolveOutputPath,
} from "@/scripts/generate-image.mjs";

// Minimal but structurally valid fixtures: a PNG signature + IHDR carrying
// width/height, and a JPEG SOI marker. Enough for the magic-byte sniffers and
// the PNG dimension read.
function makePng(width: number, height: number): Buffer {
  const b = Buffer.alloc(24);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  b.writeUInt32BE(13, 8); // IHDR chunk length
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("inspectImageBuffer", () => {
  it("accepts a PNG and reads its IHDR dimensions", () => {
    const info = inspectImageBuffer(makePng(2048, 1536), "image/png");
    expect(info).toMatchObject({
      format: "PNG",
      ext: ".png",
      width: 2048,
      height: 1536,
    });
  });

  it("accepts a JPEG (no dimensions parsed)", () => {
    const info = inspectImageBuffer(JPEG, "image/jpeg");
    expect(info).toMatchObject({ format: "JPEG", ext: ".jpg" });
    expect(info.width).toBeNull();
  });

  it("rejects an empty buffer before any I/O", () => {
    expect(() => inspectImageBuffer(Buffer.alloc(0), "image/png")).toThrow(
      /empty image/i,
    );
  });

  it("rejects an unsupported MIME type", () => {
    expect(() => inspectImageBuffer(makePng(1, 1), "image/webp")).toThrow(
      /unsupported image type "image\/webp"/i,
    );
  });

  it("rejects bytes that contradict the declared MIME type", () => {
    // JPEG bytes declared as PNG must fail rather than be written mislabeled.
    expect(() => inspectImageBuffer(JPEG, "image/png")).toThrow(
      /not a valid image\/png/i,
    );
  });
});

describe("resolveOutputPath", () => {
  const png = SUPPORTED_IMAGE_TYPES["image/png"];
  const jpeg = SUPPORTED_IMAGE_TYPES["image/jpeg"];

  it("keeps a path whose extension already matches", () => {
    expect(resolveOutputPath("out/red.png", png)).toBe("out/red.png");
  });

  it("keeps an accepted alias (.jpeg) without rewriting", () => {
    expect(resolveOutputPath("out/red.jpeg", jpeg)).toBe("out/red.jpeg");
  });

  it("rewrites a mismatched extension to the canonical one", () => {
    expect(resolveOutputPath("out/red.png", jpeg)).toBe("out/red.jpg");
  });

  it("appends an extension when the path has none", () => {
    expect(resolveOutputPath("out/red", png)).toBe("out/red.png");
  });

  it("preserves the caller's casing when the extension matches", () => {
    expect(resolveOutputPath("out/RED.PNG", png)).toBe("out/RED.PNG");
  });
});

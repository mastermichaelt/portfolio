import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import {
  SUPPORTED_IMAGE_TYPES,
  inspectImageBuffer,
  main,
  resolveOutputPath,
  resolveRequest,
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

describe("resolveRequest", () => {
  it("resolves defaults and reads key presence from the injected env", () => {
    const req = resolveRequest(
      { prompt: "a red circle" },
      { GEMINI_API_KEY: "k" },
    );
    expect(req).toMatchObject({
      prompt: "a red circle",
      model: "gemini-3-pro-image",
      aspectRatio: "1:1",
      imageSize: "2K",
      dryRun: false,
      hasApiKey: true,
    });
    expect(req.outPath).toMatch(/\.png$/);
  });

  it("flags dry-run and absent key without throwing", () => {
    const req = resolveRequest(
      { prompt: "x", "dry-run": true, size: "4K", aspect: "16:9" },
      {},
    );
    expect(req).toMatchObject({
      imageSize: "4K",
      aspectRatio: "16:9",
      dryRun: true,
      hasApiKey: false,
    });
  });

  it("throws on a missing prompt or unsupported aspect/size", () => {
    expect(() => resolveRequest({}, {})).toThrow(/Missing --prompt/);
    expect(() => resolveRequest({ prompt: "x", aspect: "5:4" }, {})).toThrow(
      /Unsupported --aspect/,
    );
    expect(() => resolveRequest({ prompt: "x", size: "8K" }, {})).toThrow(
      /Unsupported --size/,
    );
  });
});

describe("main --dry-run", () => {
  // A stdout sink and a generate spy that FAILS if the billable boundary is
  // ever crossed. Its presence in every dry-run call is the core guarantee.
  function harness() {
    let out = "";
    const stdout = { write: (s: string) => void (out += s) };
    const stderr = { write: (s: string) => void (out += s) };
    const generate = vi.fn(() => {
      throw new Error("generateImage must not be reached during --dry-run");
    });
    return { stdout, stderr, generate, output: () => out };
  }

  it("never calls generate and exits successfully with a resolved-request summary", async () => {
    const prevExit = process.exitCode;
    process.exitCode = 0;
    const h = harness();

    await expect(
      main(
        [
          "--prompt",
          "a red circle",
          "--dry-run",
          "--size",
          "4K",
          "--aspect",
          "16:9",
          "--out",
          "generated/x.png",
        ],
        { env: { GEMINI_API_KEY: "test-key" }, ...h },
      ),
    ).resolves.toBeUndefined();

    expect(h.generate).not.toHaveBeenCalled();
    expect(process.exitCode).not.toBe(1);
    const output = h.output();
    expect(output).toContain("Dry run");
    expect(output).toContain("gemini-3-pro-image");
    expect(output).toContain("4K");
    expect(output).toContain("16:9");
    expect(output).toContain("generated/x.png");
    expect(output).toContain("API key: found");

    process.exitCode = prevExit;
  });

  it("dry-runs successfully even with no API key (so it is a safe smoke test)", async () => {
    const prevExit = process.exitCode;
    process.exitCode = 0;
    const h = harness();

    await main(["--prompt", "x", "--dry-run"], { env: {}, ...h });

    expect(h.generate).not.toHaveBeenCalled();
    expect(process.exitCode).not.toBe(1);
    expect(h.output()).toContain("API key: not found");

    process.exitCode = prevExit;
  });
});

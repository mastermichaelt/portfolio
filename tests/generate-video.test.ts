import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import {
  SUPPORTED_VIDEO_TYPES,
  estimateCostUsd,
  main,
  resolveOutputPath,
  resolveRequest,
  resolveVideoType,
  verifyVideoFile,
} from "@/scripts/generate-video.mjs";

// Minimal but structurally valid fixtures: an MP4 with a `ftyp` box at offset 4,
// and a WebM/Matroska EBML header. Enough for the magic-byte sniffers.
function makeMp4(): Buffer {
  const b = Buffer.alloc(16);
  b.write("ftyp", 4, "ascii");
  b.write("isom", 8, "ascii");
  return b;
}

const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00]);

describe("estimateCostUsd", () => {
  it("multiplies per-second price by duration for a known model/resolution", () => {
    // lite 720p is $0.05/s -> 4s = $0.20.
    expect(estimateCostUsd("veo-3.1-lite-generate-preview", "720p", 4)).toBe(
      0.2,
    );
    // fast 720p is $0.10/s -> 8s = $0.80.
    expect(estimateCostUsd("veo-3.1-fast-generate-preview", "720p", 8)).toBe(
      0.8,
    );
  });

  it("returns null when pricing for the model/resolution is unknown", () => {
    expect(estimateCostUsd("some-future-model", "720p", 4)).toBeNull();
  });
});

describe("resolveVideoType", () => {
  it("resolves MP4 metadata", () => {
    expect(resolveVideoType("video/mp4")).toMatchObject({
      label: "MP4",
      ext: ".mp4",
      mimeType: "video/mp4",
    });
  });

  it("defaults an unset mimeType to MP4", () => {
    expect(resolveVideoType(undefined)).toMatchObject({
      mimeType: "video/mp4",
    });
  });

  it("rejects an unsupported type", () => {
    expect(() => resolveVideoType("video/quicktime")).toThrow(
      /unsupported video type "video\/quicktime"/i,
    );
  });
});

describe("resolveOutputPath", () => {
  const mp4 = SUPPORTED_VIDEO_TYPES["video/mp4"];
  const webm = SUPPORTED_VIDEO_TYPES["video/webm"];

  it("keeps a path whose extension already matches", () => {
    expect(resolveOutputPath("out/clip.mp4", mp4)).toBe("out/clip.mp4");
  });

  it("keeps an accepted alias (.m4v) without rewriting", () => {
    expect(resolveOutputPath("out/clip.m4v", mp4)).toBe("out/clip.m4v");
  });

  it("rewrites a mismatched extension to the canonical one", () => {
    expect(resolveOutputPath("out/clip.mp4", webm)).toBe("out/clip.webm");
  });

  it("appends an extension when the path has none", () => {
    expect(resolveOutputPath("out/clip", mp4)).toBe("out/clip.mp4");
  });
});

describe("verifyVideoFile", () => {
  // Inject fs so the sniffer can be exercised without touching disk.
  function fsFor(bytes: Buffer, size = bytes.length) {
    return {
      statSync: () => ({ size }),
      openSync: () => 1,
      readSync: (
        _fd: number,
        buffer: Buffer,
        offset: number,
        length: number,
      ) => {
        const n = Math.min(length, bytes.length);
        bytes.copy(buffer, offset, 0, n);
        return n;
      },
      closeSync: () => undefined,
    };
  }

  it("accepts a valid MP4 container", () => {
    const info = resolveVideoType("video/mp4");
    const result = verifyVideoFile("x.mp4", info, fsFor(makeMp4()));
    expect(result).toMatchObject({ format: "MP4", mimeType: "video/mp4" });
  });

  it("rejects an empty file", () => {
    const info = resolveVideoType("video/mp4");
    expect(() =>
      verifyVideoFile("x.mp4", info, fsFor(Buffer.alloc(0), 0)),
    ).toThrow(/empty/i);
  });

  it("rejects bytes that are not the declared container", () => {
    const info = resolveVideoType("video/mp4");
    expect(() => verifyVideoFile("x.mp4", info, fsFor(WEBM))).toThrow(
      /not a valid video\/mp4/i,
    );
  });
});

describe("resolveRequest", () => {
  it("resolves the cheapest defaults and reads key presence from the env", () => {
    const req = resolveRequest(
      { prompt: "a red circle moving" },
      { GEMINI_API_KEY: "k" },
    );
    expect(req).toMatchObject({
      prompt: "a red circle moving",
      model: "veo-3.1-lite-generate-preview",
      resolution: "720p",
      aspectRatio: "16:9",
      durationSeconds: 4,
      dryRun: false,
      hasApiKey: true,
      estimatedCostUsd: 0.2,
    });
    expect(req.outPath).toMatch(/\.mp4$/);
  });

  it("flags dry-run and absent key without throwing", () => {
    const req = resolveRequest(
      {
        prompt: "x",
        "dry-run": true,
        model: "veo-3.1-fast-generate-preview",
        resolution: "1080p",
        aspect: "9:16",
        duration: "8",
      },
      {},
    );
    expect(req).toMatchObject({
      model: "veo-3.1-fast-generate-preview",
      resolution: "1080p",
      aspectRatio: "9:16",
      durationSeconds: 8,
      dryRun: true,
      hasApiKey: false,
    });
  });

  it("throws on a missing prompt or unsupported model/resolution/aspect/duration", () => {
    expect(() => resolveRequest({}, {})).toThrow(/Missing --prompt/);
    expect(() => resolveRequest({ prompt: "x", model: "veo-9" }, {})).toThrow(
      /Unsupported --model/,
    );
    expect(() =>
      resolveRequest({ prompt: "x", resolution: "480p" }, {}),
    ).toThrow(/Unsupported --resolution/);
    expect(() => resolveRequest({ prompt: "x", aspect: "1:1" }, {})).toThrow(
      /Unsupported --aspect/,
    );
    expect(() => resolveRequest({ prompt: "x", duration: "5" }, {})).toThrow(
      /Unsupported --duration/,
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
      throw new Error("generateVideo must not be reached during --dry-run");
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
          "a red circle moving",
          "--dry-run",
          "--model",
          "veo-3.1-fast-generate-preview",
          "--resolution",
          "1080p",
          "--aspect",
          "9:16",
          "--duration",
          "8",
          "--out",
          "generated/x.mp4",
        ],
        { env: { GEMINI_API_KEY: "test-key" }, ...h },
      ),
    ).resolves.toBeUndefined();

    expect(h.generate).not.toHaveBeenCalled();
    expect(process.exitCode).not.toBe(1);
    const output = h.output();
    expect(output).toContain("Dry run");
    expect(output).toContain("veo-3.1-fast-generate-preview");
    expect(output).toContain("1080p");
    expect(output).toContain("9:16");
    expect(output).toContain("8s");
    expect(output).toContain("generated/x.mp4");
    expect(output).toContain("API key:    found");

    process.exitCode = prevExit;
  });

  it("dry-runs successfully even with no API key (so it is a safe smoke test)", async () => {
    const prevExit = process.exitCode;
    process.exitCode = 0;
    const h = harness();

    await main(["--prompt", "x", "--dry-run"], { env: {}, ...h });

    expect(h.generate).not.toHaveBeenCalled();
    expect(process.exitCode).not.toBe(1);
    expect(h.output()).toContain("API key:    not found");

    process.exitCode = prevExit;
  });
});

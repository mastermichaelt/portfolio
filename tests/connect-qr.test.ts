import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import jsQR from "jsqr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { LINKEDIN_PROFILE_URL } from "@/lib/connect";
import {
  decodeQrFromSvgFile,
  linkedInProfileUrlsMatch,
} from "@/lib/connect-qr-decode";

const standardQrSvgPath = resolve(
  import.meta.dirname,
  "../public/linkedin-connect-qr.svg",
);

const artQrSvgPath = resolve(
  import.meta.dirname,
  "../public/connect-qr-art.svg",
);

/** Inner QR width on `/connect` at default viewport (17.5rem panel − 2×8px padding). */
const CONNECT_QR_DISPLAY_INNER_PX = 264;

async function decodeQrFromSvgRasterizedAtWidth(
  svgPath: string,
  widthPx: number,
): Promise<string | null> {
  const raster = await sharp(svgPath).resize(widthPx).png().toBuffer();
  const { data, info } = await sharp(raster)
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

describe("linkedin-connect-qr.svg", () => {
  it("decodes to the canonical LinkedIn profile URL", async () => {
    const decoded = await decodeQrFromSvgFile(standardQrSvgPath);
    expect(decoded).toBe(LINKEDIN_PROFILE_URL);
  });
});

describe("connect-qr-art.svg", () => {
  it("decodes to the canonical LinkedIn profile URL", async () => {
    const decoded = await decodeQrFromSvgFile(artQrSvgPath);
    expect(decoded).not.toBeNull();
    expect(linkedInProfileUrlsMatch(decoded!, LINKEDIN_PROFILE_URL)).toBe(true);
  });

  it("encodes the illustrated export URL string", async () => {
    const decoded = await decodeQrFromSvgFile(artQrSvgPath);
    expect(decoded).toBe("https://linkedin.com/in/michael-truong-dev");
  });

  it("decodes at the displayed inner width on /connect", async () => {
    const decoded = await decodeQrFromSvgRasterizedAtWidth(
      artQrSvgPath,
      CONNECT_QR_DISPLAY_INNER_PX,
    );
    expect(decoded).not.toBeNull();
    expect(linkedInProfileUrlsMatch(decoded!, LINKEDIN_PROFILE_URL)).toBe(true);
  });
});

describe("Connect QR toggle", () => {
  it("exports accessible toggle labels for both modes", async () => {
    const {
      CONNECT_QR_TOGGLE_SHOW_ILLUSTRATED,
      CONNECT_QR_TOGGLE_SHOW_STANDARD,
    } = await import("@/lib/connect");
    expect(CONNECT_QR_TOGGLE_SHOW_STANDARD).toBe(
      "Having trouble scanning? Show standard QR",
    );
    expect(CONNECT_QR_TOGGLE_SHOW_ILLUSTRATED).toBe("Show illustrated QR");

    const source = await readFile(
      resolve(import.meta.dirname, "../components/connect/ConnectQrToggle.tsx"),
      "utf8",
    );
    expect(source).toContain("aria-pressed");
    expect(source).toContain("aria-controls");
    expect(source).toContain("CONNECT_QR_TOGGLE_SHOW_STANDARD");
  });
});

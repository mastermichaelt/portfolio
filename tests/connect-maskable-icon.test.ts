import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  MASKABLE_BACKGROUND_ZOOM_RATIO,
  buildConnectMaskableBlurredBackground,
  extractConnectPortraitSquare,
} from "../scripts/lib/connect-portrait-crop.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("connect maskable icon generation", () => {
  it("applies background zoom before blur and downscale", async () => {
    const source = resolve(root, "public/connect-portrait-source.jpg");
    expect(existsSync(source)).toBe(true);

    const square = await extractConnectPortraitSquare(sharp, source);
    const size = 512;
    const withZoom = await buildConnectMaskableBlurredBackground(
      sharp,
      square,
      size,
    );

    const withoutZoom = await square
      .clone()
      .resize(size, size, { fit: "cover", position: "centre" })
      .blur(16)
      .png()
      .toBuffer();

    const zoom = Math.round(size * MASKABLE_BACKGROUND_ZOOM_RATIO);
    const brokenChainedResize = await square
      .clone()
      .resize(zoom, zoom, { fit: "cover", position: "centre" })
      .blur(16)
      .resize(size, size, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    expect(withZoom.equals(withoutZoom)).toBe(false);
    expect(withZoom.equals(brokenChainedResize)).toBe(false);
    expect(brokenChainedResize.equals(withoutZoom)).toBe(true);
  });
});

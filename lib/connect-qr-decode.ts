import { readFile } from "node:fs/promises";

import jsQR from "jsqr";
import sharp from "sharp";

async function decodeQrFromRasterBuffer(
  buffer: Buffer,
): Promise<string | null> {
  const { data, info } = await sharp(buffer)
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

/** Decode the first QR payload from a raster image file (JPEG, PNG, etc.). */
export async function decodeQrFromImageFile(
  imagePath: string,
): Promise<string | null> {
  return decodeQrFromRasterBuffer(await readFile(imagePath));
}

/** Rasterize an SVG QR asset and decode its payload. */
export async function decodeQrFromSvgFile(
  svgPath: string,
): Promise<string | null> {
  const raster = await sharp(svgPath).png().toBuffer();
  return decodeQrFromRasterBuffer(raster);
}

/** True when decoded URL targets the same LinkedIn profile as the canonical URL. */
export function linkedInProfileUrlsMatch(
  decoded: string,
  canonical: string,
): boolean {
  const decodedUrl = new URL(decoded);
  const canonicalUrl = new URL(canonical);

  const normalizeHostname = (hostname: string) => {
    if (hostname === "linkedin.com" || hostname === "www.linkedin.com") {
      return "www.linkedin.com";
    }
    return hostname;
  };

  const normalizePath = (pathname: string) =>
    pathname.replace(/\/$/, "") || "/";

  return (
    decodedUrl.protocol === canonicalUrl.protocol &&
    normalizeHostname(decodedUrl.hostname) ===
      normalizeHostname(canonicalUrl.hostname) &&
    normalizePath(decodedUrl.pathname) === normalizePath(canonicalUrl.pathname)
  );
}

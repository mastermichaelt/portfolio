/**
 * Approved square crop on connect-portrait-source.jpg (768×1024).
 * Tuned against the LinkedIn QR card reference portrait circle (900×835).
 */
export const SOURCE_CROP_BASE = {
  width: 768,
  height: 1024,
  left: 102,
  top: 246,
  size: 572,
};

export function squareCropRegion(width, height) {
  const scaleX = width / SOURCE_CROP_BASE.width;
  const scaleY = height / SOURCE_CROP_BASE.height;
  const size = Math.min(
    Math.round(SOURCE_CROP_BASE.size * scaleX),
    width,
    height,
  );
  const left = Math.min(
    Math.round(SOURCE_CROP_BASE.left * scaleX),
    width - size,
  );
  const top = Math.min(
    Math.round(SOURCE_CROP_BASE.top * scaleY),
    height - size,
  );
  return { left, top, width: size, height: size };
}

export async function extractConnectPortraitSquare(sharp, inputPath) {
  const meta = await sharp(inputPath).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error(`Could not read dimensions for ${inputPath}`);
  }
  return sharp(inputPath).extract(squareCropRegion(width, height));
}

/** Maskable safe zone: centered circle with diameter 80% of the icon edge (W3C). */
export const MASKABLE_SAFE_ZONE_DIAMETER_RATIO = 0.8;

/**
 * Full-bleed maskable launcher icon from the approved square crop.
 * Blurred cover fill reaches every edge; the sharp portrait fills the canvas so
 * Android adaptive icons do not letterbox with a white ring.
 */
export async function composeConnectMaskableIcon(sharp, squarePipeline, size) {
  const zoom = Math.round(size * 1.08);
  const background = await squarePipeline
    .clone()
    .resize(zoom, zoom, { fit: "cover", position: "centre" })
    .blur(16)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const foreground = await squarePipeline
    .clone()
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  return sharp(background).composite([{ input: foreground, left: 0, top: 0 }]);
}

/** Approximate Android circular launcher mask for local preview. */
export function composeConnectMaskableIconPreview(
  sharp,
  maskablePipeline,
  size,
) {
  const radius = size / 2;
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/></svg>`,
  );
  const pad = Math.round(size * 0.12);
  const backdrop = "#121110";
  return maskablePipeline
    .clone()
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: backdrop,
    });
}

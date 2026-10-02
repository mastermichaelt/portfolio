# Brand icons — pixel-art avatar

Three committed PNG deliverables for michaeltruong.ai web identity (Slice 1). Wiring into `<head>` and manifest is deferred to Slice 2/3.

## Identity reference (not style source)

Likeness cues come from [`public/portrait-michael-1200.jpg`](../../public/portrait-michael-1200.jpg) — the canonical photographic reference on the site. **Style is not derived from the photo.** Artwork follows a clean **16-bit JRPG / Pixel Remaster** sprite direction (dialogue-portrait charm, stylized proportions, restrained palette).

**Recognizable traits (do not invent or alter):**

- Dark hair with a simple readable silhouette
- Black rectangular glasses
- Friendly smiling expression (sprite mouth — no individual teeth)
- Dark crew-neck shirt
- Small owl companion on the left shoulder (larger compositions only)

## Visual direction

Hand-crafted **JRPG character portrait sprites** — warm, charming, readable. **Not** photoreal, **not** a photo converted to pixels, **not** a photo downscale, **not** an MT monogram.

**Sprite rules:**

- Stylized JRPG proportions rather than realistic facial anatomy
- Simplified eyes, nose, and mouth as deliberate sprite features
- Restrained pixel-art palette with intentional color clusters — no photographic skin gradients or soft shading
- Hair silhouette and glasses do most of the recognition work

## Final deliverables (`public/`)

| File                         | Size    | Role                                                         |
| ---------------------------- | ------- | ------------------------------------------------------------ |
| `favicon-32x32.png`          | 32×32   | Browser favicon source — simplified for tab-scale legibility |
| `apple-touch-icon.png`       | 180×180 | Apple touch icon — richer avatar with owl                    |
| `android-chrome-192x192.png` | 192×192 | Manifest / browser identity — richer avatar with owl         |

## Size-specific rules

- **32×32 favicon:** Purpose-built sprite art at native 32×32 (hand-authored grid) — not a downsampled portrait. Prioritize hair silhouette, glasses, and smile. Owl **omitted** — too small to read at favicon presentation size.
- **180×180 and 192×192:** Preserve the richer composition including the owl on the shoulder.
- All three share the **same pixel-art identity** but are **not** forced integer upscales of the 32×32 sprite — size-specific simplification is intentional.

## Why 32×32 source, not 16×16

Browsers display favicons at approximately **16 CSS px** in tabs, but a **16×16 source raster** is too constrained for hair, glasses, expression, and face clarity. Visual testing rejected 16×16.

**Validation:** Review `favicon-32x32.png` at **~16 CSS px** display size (browser tab or equivalent preview), not only at native 32×32.

## Optional source artwork (`lib/brand/`)

| File                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `avatar-pixel-source.png`         | Richer owl composition for 180/192 outputs       |
| `avatar-pixel-favicon-source.png` | Hand-authored 32×32 JRPG favicon sprite (no owl) |

These document the preferred compositions; the three `public/` PNGs are the **final deliverables**.

## Explicitly not in scope (Slice 1)

- 16×16 raster, 48×48, 512×512, or other redundant sizes
- `.ico` or multi-size `favicon.ico`
- `app/icon.tsx` / `app/apple-icon.tsx` `ImageResponse` routes
- Mandatory `sharp` or generation scripts in `package.json` (derivation may use ad-hoc dev tooling)

## MT monogram fallback

An **MT monogram** is a **fallback candidate only** if the pixel avatar fails favicon legibility review at ~16 CSS px. It is not the default path.

## Reproducibility

Regeneration is manual design judgment: style-first JRPG sprite art for 180/192 sources, hand-authored 32×32 favicon grid. Identity reference portrait informs likeness only. A lightweight `npm run generate:icons` script is optional and not required for Slice 1.

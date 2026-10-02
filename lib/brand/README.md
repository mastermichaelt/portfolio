# Brand icons — pixel-art avatar

Three committed PNG deliverables for michaeltruong.ai web identity (Slice 1). Wiring into `<head>` and manifest is deferred to Slice 2/3.

## Reference portrait

Derived from [`public/portrait-michael-1200.jpg`](../../public/portrait-michael-1200.jpg) — the canonical photographic reference on the site.

**Recognizable traits (do not invent or alter):**

- Dark hair
- Black rectangular glasses
- Warm smile
- Dark charcoal crew-neck shirt
- Small owl on the left shoulder (larger compositions only)

## Visual direction

Clean modern **16-bit / Pixel Remaster** pixel art — not photoreal, not a photo downscale, not an MT monogram.

## Final deliverables (`public/`)

| File                         | Size    | Role                                                         |
| ---------------------------- | ------- | ------------------------------------------------------------ |
| `favicon-32x32.png`          | 32×32   | Browser favicon source — simplified for tab-scale legibility |
| `apple-touch-icon.png`       | 180×180 | Apple touch icon — richer avatar with owl                    |
| `android-chrome-192x192.png` | 192×192 | Manifest / browser identity — richer avatar with owl         |

## Size-specific rules

- **32×32 favicon:** Prioritize hair, glasses, expression, and face. Owl **omitted** — too small to read at favicon presentation size.
- **180×180 and 192×192:** Preserve the richer composition including the owl on the shoulder.
- All three share the **same pixel-art identity** but are **not** forced integer upscales of the 32×32 sprite — size-specific simplification is intentional.

## Why 32×32 source, not 16×16

Browsers display favicons at approximately **16 CSS px** in tabs, but a **16×16 source raster** is too constrained for hair, glasses, expression, and face clarity. Visual testing rejected 16×16.

**Validation:** Review `favicon-32x32.png` at **~16 CSS px** display size (browser tab or equivalent preview), not only at native 32×32.

## Optional source artwork (`lib/brand/`)

| File                              | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `avatar-pixel-source.png`         | Richer owl composition for 180/192 outputs            |
| `avatar-pixel-favicon-source.png` | Favicon-focused composition (no owl) for 32×32 output |

These document the preferred compositions; the three `public/` PNGs are the **final deliverables**.

## Explicitly not in scope (Slice 1)

- 16×16 raster, 48×48, 512×512, or other redundant sizes
- `.ico` or multi-size `favicon.ico`
- `app/icon.tsx` / `app/apple-icon.tsx` `ImageResponse` routes
- Mandatory `sharp` or generation scripts in `package.json` (derivation may use ad-hoc dev tooling)

## MT monogram fallback

An **MT monogram** is a **fallback candidate only** if the pixel avatar fails favicon legibility review at ~16 CSS px. It is not the default path.

## Reproducibility

Regeneration is manual design judgment from the reference portrait and optional source files above. A lightweight `npm run generate:icons` script is optional and not required for Slice 1.

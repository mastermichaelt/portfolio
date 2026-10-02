# Brand icons — pixel-art avatar

Three committed PNG deliverables for michaeltruong.ai web identity (Slice 1). Wiring into `<head>` and manifest is deferred to Slice 2/3.

## Dual-reference derivation

Two references with different authority:

| Reference                     | Role                                                                  | Source                                                                       |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Canonical portrait**        | Likeness — hair shape, glasses, expression, shirt, owl placement      | [`public/portrait-michael-1200.jpg`](../../public/portrait-michael-1200.jpg) |
| **Approved pixel-art avatar** | Style — proportions, simplification, palette, pixel edges, JRPG charm | `lib/brand/avatar-pixel-source.png` (squared from approved comp)             |

**Goal:** likeness from the portrait, rendered in the visual language of the approved pixel reference. **Not** a photo downsample or text-only generation.

The approved pixel comp is the **primary art-direction source**. The canonical portrait corrects likeness only where needed (e.g. favicon derivation uses both references).

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

- **32×32 favicon:** Simplified treatment of the approved character design for tiny display — derived from both references, then resized to native 32×32. Hair silhouette + glasses carry identity; smile stays a simple dash; owl **omitted**.
- **180×180 and 192×192:** Nearest-neighbor upscale of the approved pixel comp — preserves owl, hair, glasses, and full sprite identity.
- All three share the **same pixel-art identity** but are **not** forced integer upscales of the 32×32 sprite — size-specific simplification is intentional.

## Why 32×32 source, not 16×16

Browsers display favicons at approximately **16 CSS px** in tabs, but a **16×16 source raster** is too constrained for hair, glasses, expression, and face clarity. Visual testing rejected 16×16.

**Validation:** Review `favicon-32x32.png` at **~16 CSS px** display size (browser tab or equivalent preview), not only at native 32×32.

## Optional source artwork (`lib/brand/`)

| File                              | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `avatar-pixel-source.png`         | Approved pixel comp (squared) — master for 180/192        |
| `avatar-pixel-favicon-source.png` | Favicon derivation source (both refs) before 32×32 resize |

These document the preferred compositions; the three `public/` PNGs are the **final deliverables**.

## Explicitly not in scope (Slice 1)

- 16×16 raster, 48×48, 512×512, or other redundant sizes
- `.ico` or multi-size `favicon.ico`
- `app/icon.tsx` / `app/apple-icon.tsx` `ImageResponse` routes
- Mandatory `sharp` or generation scripts in `package.json` (derivation may use ad-hoc dev tooling)

## MT monogram fallback

An **MT monogram** is a **fallback candidate only** if the pixel avatar fails favicon legibility review at ~16 CSS px. It is not the default path.

## Reproducibility

Regeneration requires both visual references (approved pixel comp + canonical portrait). 180/192 upscale the approved comp; 32×32 favicon simplifies that design with both refs. A lightweight `npm run generate:icons` script is optional and not required for Slice 1.

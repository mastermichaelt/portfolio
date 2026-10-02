# Brand icons — pixel-art avatar

Three committed PNG deliverables for michaeltruong.ai web identity (Slice 1). Wiring into `<head>` and manifest is deferred to Slice 2/3.

## Reference hierarchy

| Priority | Reference                       | Path                                                                         | Role                                                                         |
| -------- | ------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1        | **Canonical photograph**        | [`public/portrait-michael-1200.jpg`](../../public/portrait-michael-1200.jpg) | Likeness truth — hair, glasses, expression, shirt, owl                       |
| 2        | **Approved pixel-art portrait** | [`approved-pixel-reference.png`](./approved-pixel-reference.png)             | Character/style truth — proportions, palette, pixel treatment, owl rendering |

**Immutable:** `approved-pixel-reference.png` is a pristine copy of the supplied approved comp. Do not overwrite, crop, resize, or modify it.

**Goal:** likeness from the photograph + character/style from the approved pixel reference. Production assets are **adaptations of that one character**, not separately generated interpretations.

## Visual direction

Charming **16-bit / Pixel Remaster** JRPG character portrait — hard pixel edges, restrained palette, simplified sprite features. **Not** photoreal, **not** a photo downscale, **not** text-prompt regeneration.

## Presentation artifacts (not in production)

The approved pixel reference displays the character inside a rounded dark tile with blue visible around it. These are **presentation only** and must **not** appear in production PNGs:

- rounded-square / tile boundary
- rounded corners baked into artwork
- blue border or outer blue background
- outer padding that creates an icon-within-an-icon look

## Production background

Production icons use a **flat, full-bleed dark background** (`~#101011`) extending to every canvas edge. The dark interior of the approved reference is continued outward to fill the square.

- Background is **not** transparent
- **No** baked app-icon mask — platforms apply their own masks

## Final deliverables (`public/`)

| File                         | Size    | Derivation                                                            |
| ---------------------------- | ------- | --------------------------------------------------------------------- |
| `favicon-32x32.png`          | 32×32   | Canonical master → nearest-neighbor 32×32 → manual owl/detail removal |
| `apple-touch-icon.png`       | 180×180 | Canonical master → nearest-neighbor 180×180                           |
| `android-chrome-192x192.png` | 192×192 | Canonical master → nearest-neighbor 192×192                           |

### Canonical master (in-memory derivation step)

From `approved-pixel-reference.png`:

1. Replace blue presentation surround pixels with dark interior color
2. Center on a square canvas with full-bleed dark background
3. Do **not** upscale the reference image wholesale (that reproduces tile + blue surround)

### Size-specific rules

- **32×32 favicon:** Same character with detail removed — owl omitted, shoulder clutter cleared. **Not** independently generated. Validate at **~16 CSS px** display size (browser tab).
- **180×180 and 192×192:** Faithful adaptations preserving hair silhouette, face proportions, glasses, smile, shirt, owl, palette, and shading.
- All three must be immediately recognizable as the **same** approved character at different detail levels.

## Explicitly not in scope (Slice 1)

- 16×16 raster, 48×48, 512×512, or other redundant sizes
- `.ico` or multi-size `favicon.ico`
- `app/icon.tsx` / `app/apple-icon.tsx` `ImageResponse` routes
- Mandatory `sharp` or generation scripts in `package.json`
- Generative models (e.g. Gemini) for character or favicon artwork

## MT monogram fallback

An **MT monogram** is a **fallback candidate only** if the pixel avatar fails favicon legibility review at ~16 CSS px. It is not the default path.

## Tests

`tests/brand-icons.test.ts` — existence, exact dimensions (32 / 180 / 192), non-trivial byte size. Visual QA is manual; subjective quality is not encoded in tests.

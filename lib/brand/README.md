# Brand icons — pixel-art avatar

Three committed PNG deliverables for michaeltruong.ai web identity (Slice 1). Wiring into `<head>` and manifest is deferred to Slice 2/3.

## References

| Reference                | Path                                                                           | Role                                                          |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Canonical photograph** | [`public/portrait-michael-1200.jpg`](../../public/portrait-michael-1200.jpg)   | Likeness sanity check — hair, glasses, expression, shirt, owl |
| **Production master**    | [`public/android-chrome-192x192.png`](../../public/android-chrome-192x192.png) | Approved pixel character artwork (192×192, full-bleed dark)   |

Production icons are **adaptations of one character design**, not separately generated interpretations.

## Visual direction

Charming **16-bit / Pixel Remaster** JRPG character portrait — hard pixel edges, restrained palette, simplified sprite features. **Not** photoreal, **not** a photo downscale, **not** text-prompt regeneration.

## Production background

Icons use a **flat, full-bleed dark background** extending to every canvas edge.

- Background is **not** transparent
- **No** baked app-icon mask — platforms apply their own masks

## Final deliverables (`public/`)

| File                         | Size    | Derivation                                                    |
| ---------------------------- | ------- | ------------------------------------------------------------- |
| `android-chrome-192x192.png` | 192×192 | Production master — used as-is                                |
| `apple-touch-icon.png`       | 180×180 | Center crop of `android-chrome-192x192.png` (6 px per side)   |
| `favicon-32x32.png`          | 32×32   | Nearest-neighbor downscale of 192 master → manual owl removal |

### Size-specific rules

- **32×32 favicon:** Same character with detail removed — owl omitted, shoulder clutter cleared. **Not** independently generated. Validate at **~16 CSS px** display size (browser tab).
- **180×180 and 192×192:** Same approved character; Apple is a slight center crop of the 192 master.
- All three must be immediately recognizable as the **same** character at different detail levels.

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

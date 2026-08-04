# Brand spec — AI Engineering Portfolio

Extracted from the creative brief (sage / warm neutrals override).

## Color tokens (OKLch + hex)

| Token       | Hex       | OKLch                  |
| ----------- | --------- | ---------------------- |
| `--bg`      | `#f6f2eb` | `oklch(96% 0.012 85)`  |
| `--surface` | `#fffdf9` | `oklch(99% 0.006 90)`  |
| `--fg`      | `#1a1916` | `oklch(22% 0.012 85)`  |
| `--muted`   | `#6e6860` | `oklch(50% 0.016 75)`  |
| `--border`  | `#e2dbd0` | `oklch(90% 0.014 85)`  |
| `--accent`  | `#5c7359` | `oklch(52% 0.055 145)` |

Secondary signal (derived): `color-mix(in oklch, var(--accent) 55%, var(--fg))` for deeper sage on hover/active.

## Typography

- **Display:** `Newsreader`, `Iowan Old Style`, `Charter`, Georgia, serif
- **Body:** `Source Sans 3`, system-ui, -apple-system, Segoe UI, sans-serif
- **Mono:** `IBM Plex Mono`, ui-monospace, Menlo, monospace

## Layout posture

1. 8px baseline; radii 8–12px (cards 12px)
2. Hairline 1px borders; soft depth via 1–2 layered shadows only on interactive surfaces
3. Single sage accent — eyebrow + primary CTA (≤2 uses per screen)
4. Progressive disclosure over dense dumps; evidence packs collapse by default
5. System map is the decisive flourish — relationships over decoration

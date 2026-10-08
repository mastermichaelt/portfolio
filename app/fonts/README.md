# IBM Plex (self-hosted)

Latin **IBM Plex Sans** (400, 500, 600) and **IBM Plex Mono** (400, 500) for `next/font/local` via [`lib/fonts.ts`](../../lib/fonts.ts).

**Provenance:** WOFF2 files copied from [@fontsource/ibm-plex-sans@5.1.1](https://www.npmjs.com/package/@fontsource/ibm-plex-sans) and [@fontsource/ibm-plex-mono@5.1.1](https://www.npmjs.com/package/@fontsource/ibm-plex-mono) (same glyph coverage as the previous `next/font/google` latin subset). Typeface license: IBM Plex SIL OFL — see `LICENSE`.

**Why self-host:** `next/font/google` downloads font metadata at build time; intermittent CI failures when Google Fonts is slow or returns empty responses.

# Image generation (dev tooling)

Occasional developer tooling for generating candidate portfolio visuals with
Google's **Nano Banana Pro** (`gemini-3-pro-image`) via the official
[`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK. This is
**not** a production feature: no `app/` code imports it, the SDK is a
`devDependency`, and the API key never reaches the client or the deployed
runtime.

All Google-specific code lives in one file — [`scripts/generate-image.mjs`](../scripts/generate-image.mjs).
To swap providers later, replace `generateImage()` and the SDK import there;
nothing else in the repo depends on it.

## Setup

Add a Gemini API key to `.env.local` at the repo root (gitignored; see
[`.env.example`](../.env.example)). Get one from
[Google AI Studio](https://aistudio.google.com/apikey):

```bash
GEMINI_API_KEY=your-key
```

## Generate an image

```bash
npm run generate:image -- --prompt "A single red circle on a plain white background"
```

Options:

| Flag       | Default                     | Notes                                        |
| ---------- | --------------------------- | -------------------------------------------- |
| `--prompt` | _(required)_                | What to generate.                            |
| `--out`    | `generated/<timestamp>.png` | Output file path (dirs created as needed).   |
| `--aspect` | `1:1`                       | `1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9`. |
| `--size`   | `2K`                        | `1K, 2K, 4K` (largest dimension).            |
| `--model`  | `gemini-3-pro-image`        | Override only if the model id changes.       |

Example with controls and a chosen path:

```bash
npm run generate:image -- \
  --prompt "Isometric knowledge-graph node, flat brand palette" \
  --aspect 16:9 --size 4K --out generated/graph-node.png
```

Run `npm run generate:image -- --help` for the full flag list.

## Disposable output vs. production assets

Generations land in `generated/` by default — a **disposable, gitignored**
scratch area (see [`.gitignore`](../.gitignore)). Inspect, edit, or discard
freely; nothing here ships.

To **promote** a chosen image into the portfolio, move it into `public/` (the
served static-asset root, alongside e.g. `public/portrait-michael.jpg`) and
reference it from a component. Committing it into `public/` is what makes it a
production asset:

```bash
mv generated/graph-node.png public/graph-node.png
git add public/graph-node.png
```

Note: Gemini 3 Pro Image embeds an invisible SynthID watermark identifying the
image as AI-generated.

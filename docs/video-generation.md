# Video generation (dev tooling)

Occasional developer tooling for generating candidate portfolio **motion**
visuals with Google's **Veo 3.1** via the official
[`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK. Like the
[image generator](image-generation.md), this is **not** a production feature: no
`app/` code imports it, the SDK is a `devDependency`, and the API key never
reaches the client or the deployed runtime.

This is a **separate** tool from the image generator, not an extension of it.
Video generation is asynchronous (submit → poll → download), materially more
expensive, and has different request/response shapes, so it lives in its own
file — [`scripts/generate-video.mjs`](../scripts/generate-video.mjs). To swap
providers later, replace `generateVideo()` and the SDK import there; nothing else
in the repo depends on it.

This tool is **text-to-video only**. Image-to-video, reference/last-frame images,
and other Veo modes are intentionally not exposed.

## Cost safety

Veo is billed **per generated second** and is far more expensive than image
generation, so the tool is built for safe use:

- Defaults are the **cheapest practical** supported configuration: the lite model
  at 720p for the shortest (4s) clip.
- Expensive choices (higher-tier models, 1080p, longer durations) must be
  requested **explicitly** — they are never silent defaults.
- A single invocation submits **exactly one** operation and produces **at most
  one** video. The tool **never retries or regenerates** on its own.
- `--dry-run` resolves and prints the request — including an approximate cost
  estimate — and makes **no** network call and writes **no** file, even when a
  key is present.

The printed cost is a **local estimate only** (from a small built-in table);
Google bills the real amount. Confirm current pricing at
[ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Setup

Uses the same `GEMINI_API_KEY` as the image generator. Add it to `.env.local` at
the repo root (gitignored; see [`.env.example`](../.env.example)). Get one from
[Google AI Studio](https://aistudio.google.com/apikey):

```bash
GEMINI_API_KEY=your-key
```

The key must have Veo access. Check with a free (non-billable) model list:
`GET https://generativelanguage.googleapis.com/v1beta/models?key=…` should
include `veo-3.1-*` models.

## Generate a video

```bash
npm run generate:video -- --prompt "A solid red circle moves from left to right on a plain white background"
```

Options:

| Flag           | Default                         | Notes                                                    |
| -------------- | ------------------------------- | -------------------------------------------------------- |
| `--prompt`     | _(required)_                    | What to generate.                                        |
| `--out`        | `generated/<timestamp>.mp4`     | Output file path (dirs created as needed).               |
| `--model`      | `veo-3.1-lite-generate-preview` | `…-lite-…` (cheapest), `…-fast-…`, `…-generate-preview`. |
| `--resolution` | `720p`                          | `720p`, `1080p`.                                         |
| `--aspect`     | `16:9`                          | `16:9`, `9:16`.                                          |
| `--duration`   | `4`                             | `4`, `6`, `8` (seconds).                                 |
| `--negative`   | _(none)_                        | Optional. What to avoid.                                 |
| `--dry-run`    | off                             | Print the resolved request; no network, no file.         |

Veo 3.1 **always generates audio** (it cannot be disabled). Some
resolution/duration combinations are model-specific (e.g. 1080p may require a
longer duration); the API is the final authority and will reject invalid combos.

Run `npm run generate:video -- --help` for the full flag list.

### Safe smoke test (`--dry-run`)

Veo is **paid**, and the key is loaded automatically from `.env.local`, so a
normal invocation is billable even when no key is exported in the shell. To
exercise the CLI — argument parsing, validation, output-path/key resolution, and
the cost estimate — **without** a billable call, add `--dry-run`:

```bash
npm run generate:video -- --prompt "..." --model veo-3.1-fast-generate-preview --dry-run
```

### Async lifecycle

A run submits one long-running operation, then **polls the same operation**
(every ~10s, up to a 10-minute ceiling) until it completes — it never resubmits.
It prints elapsed-time progress while waiting, then downloads the finished video
via the SDK's `files.download`. The saved file's extension is set from the
container Google actually returns (MP4), and the bytes on disk are verified to be
a valid container before success is reported.

## Disposable output vs. production assets

Generations land in `generated/` by default — a **disposable, gitignored**
scratch area (see [`.gitignore`](../.gitignore)). Inspect or discard freely;
nothing here ships.

To **promote** a chosen video into the portfolio, move it into `public/` (the
served static-asset root) and reference it from a component. Committing it into
`public/` is what makes it a production asset:

```bash
mv generated/clip.mp4 public/clip.mp4
git add public/clip.mp4
```

Note: Veo embeds an invisible SynthID watermark identifying the video as
AI-generated.

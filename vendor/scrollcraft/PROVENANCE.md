# scroll-craft engine — vendored, unmodified

The engine is the mechanism and **is never edited per project** ([SKILL.md, "The one
rule that matters most"](https://github.com/nateherkai/scroll-craft#the-one-rule-that-matters-most)).
Bespoke behaviour is authored in this repo's own markup and CSS, driven off the
`--sc-p` custom property the engine publishes.

|               |                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------- |
| Source        | `nateherkai/scroll-craft`, plugin `nateherk-design`                                          |
| Version       | 0.3.0                                                                                        |
| Upstream path | `plugins/nateherk-design/skills/scroll-craft/engine/scrollcraft.js`                          |
| Vendored to   | [`public/vendor/scrollcraft/scrollcraft.js`](../../public/vendor/scrollcraft/scrollcraft.js) |
| sha256        | `9246fbe4e240a63cdaf33111edd724ee66118da87dc44af86039b0d1619164a1`                           |

`tests/scrollcraft-engine-integrity.test.ts` asserts that hash, so a reformat, a
lint autofix, or a well-meant edit fails the build instead of landing quietly.

## Served, not bundled

The engine lives under `public/` and is loaded by `<Script src="/vendor/scrollcraft/scrollcraft.js">`,
so it never enters the application module graph: nothing in `app/`, `components/`,
`domain/`, `repositories/` or `lib/` imports it, and no bundler transform touches
the bytes the hash covers. Removing the experiment means deleting one component,
one stylesheet and one attribute pass.

## The upstream stylesheet is deliberately NOT vendored

`engine/scrollcraft.css` is two layers: a **taste floor** (a `:root` token block, a
reset, and `body { background / color / font-family / font-size / line-height /
letter-spacing }`, plus `::selection`, `:focus-visible`, `html { scroll-behavior }`
and scrollbar theming) and the **device rules** the engine actually drives. Only
the second layer is mechanism. Importing the file would replace this portfolio's
typography, colour roles and both themes.

[`app/styles/scrollcraft.css`](../../app/styles/scrollcraft.css) therefore carries a
hand-scoped subset of the device rules, expressed in this portfolio's own tokens.
It records which upstream rules were taken and which were refused, and why.

## Updating

Refresh the plugin (`npx impeccable`-style in-place updates do not apply here):

```bash
claude plugin marketplace update nateherk
```

Then re-copy the engine, update the version and hash above, and re-read
`app/styles/scrollcraft.css` against the new upstream device rules before
trusting the diff.

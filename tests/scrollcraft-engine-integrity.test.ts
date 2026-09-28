import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const ENGINE = "public/vendor/scrollcraft/scrollcraft.js";
const PROVENANCE = "vendor/scrollcraft/PROVENANCE.md";

/**
 * scroll-craft's one hard rule is that the engine is the mechanism and is never
 * edited per project. Nothing in the toolchain enforces that on its own:
 * Prettier, an ESLint autofix, or a well-meant "small fix" would all land
 * silently. These tests make the engine's bytes, its exclusion from the module
 * graph, and the refusal of its global stylesheet into build failures instead.
 */
describe("vendored scroll-craft engine", () => {
  it("matches the sha256 recorded in PROVENANCE.md", () => {
    const declared = /sha256\s*\|\s*`([0-9a-f]{64})`/.exec(read(PROVENANCE));
    expect(declared, "sha256 row in PROVENANCE.md").not.toBeNull();

    const actual = createHash("sha256")
      .update(readFileSync(resolve(root, ENGINE)))
      .digest("hex");

    expect(
      actual,
      `${ENGINE} no longer matches PROVENANCE.md. Do not edit the engine: ` +
        "author bespoke behaviour in this repo's own markup and CSS, driven off " +
        "the --sc-p custom property. If this is a deliberate upstream bump, " +
        "update the version and hash in PROVENANCE.md in the same commit.",
    ).toBe(declared?.[1]);
  });

  it("is ignored by Prettier and ESLint, so neither can reformat it", () => {
    expect(read(".prettierignore")).toMatch(/^public\/vendor\/scrollcraft\/$/m);
    expect(read("eslint.config.mjs")).toMatch(
      /"public\/vendor\/scrollcraft\/\*\*"/,
    );
  });

  it("stays out of the application module graph", () => {
    // Served via <Script src>, never imported. An import would put the engine
    // through the bundler (invalidating the hash as a runtime guarantee) and
    // would make it a dependency of the app rather than a leaf of one page.
    expect(read("components/experiments/ScrollCraftMethodReveal.tsx")).toMatch(
      /src="\/vendor\/scrollcraft\/scrollcraft\.js"/,
    );
    expect(
      read("components/experiments/ScrollCraftMethodReveal.tsx"),
    ).not.toMatch(/^import .*scrollcraft/m);
  });
});

/**
 * Selectors of every style rule in `css`, with at-rule preludes skipped.
 *
 * Splitting on braces and treating each prelude as a selector breaks the moment
 * the stylesheet contains an at-rule: `@media print { ... }` yields a
 * pseudo-selector of `@media print`, which then fails the scoping assertion
 * below and reports a legitimate media query as unscoped CSS. This walks the
 * braces instead, so a nested rule inside an at-rule is still checked on its
 * own terms while the at-rule's own prelude is not mistaken for a selector.
 */
function ruleSelectors(css: string): string[] {
  const selectors: string[] = [];
  let prelude = "";

  for (const char of css) {
    if (char === "{") {
      const text = prelude.trim();
      prelude = "";
      // An at-rule's prelude is a condition, not a selector. Its nested rules
      // are collected on the next iteration of this same loop.
      if (text.startsWith("@")) continue;
      for (const selector of text.split(",")) {
        const trimmed = selector.trim();
        if (trimmed) selectors.push(trimmed);
      }
    } else if (char === "}") {
      // Declarations accumulated since the opening brace, or the end of a
      // nested block. Either way there is no pending selector.
      prelude = "";
    } else {
      prelude += char;
    }
  }

  return selectors;
}

describe("scroll-craft styling boundary", () => {
  const scoped = read("app/styles/scrollcraft.css");
  // The file's comments name the upstream rules this stylesheet refuses, so the
  // assertions below have to read the declarations, not the prose about them.
  const declarations = scoped.replace(/\/\*[\s\S]*?\*\//g, "");

  it("does not adopt the engine's global taste floor", () => {
    // The upstream stylesheet restyles body typography and colour, `:root`
    // tokens, ::selection, :focus-visible, scrollbars and html scroll-behavior.
    // Any of those arriving here would silently outrank the design system.
    for (const banned of [
      "--sc-canvas:",
      "--sc-ink:",
      "--sc-font-display:",
      "scroll-behavior",
      "::selection",
      ":focus-visible",
      "scrollbar-color",
    ]) {
      expect(
        declarations,
        `${banned} belongs to the engine's taste floor`,
      ).not.toMatch(banned);
    }

    const globals = read("app/globals.css");
    expect(globals).toMatch(/@import "\.\/styles\/scrollcraft\.css";/);
    expect(
      globals,
      "the upstream engine stylesheet is never imported",
    ).not.toMatch(/scrollcraft\.upstream|engine\/scrollcraft\.css/);
  });

  it("scopes every rule to the mounted experiment root", () => {
    const selectors = ruleSelectors(declarations);

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector, "unscoped scroll-craft selector").toContain(
        "[data-scrollcraft-scope]",
      );
    }
  });

  it("checks rules nested inside at-rules, and does not mistake the at-rule for one", () => {
    // Guards the parser itself: the scoping assertion above is only meaningful
    // if it still reaches inside a @media block, and only usable if a media
    // query does not fail it. Both directions, on a fixture rather than on the
    // real file, so the test keeps its meaning as the stylesheet changes.
    expect(
      ruleSelectors(
        "@media print { [data-scrollcraft-scope] .a { opacity: 1 } }",
      ),
    ).toEqual(["[data-scrollcraft-scope] .a"]);

    expect(ruleSelectors("@media print { .unscoped { opacity: 1 } }")).toEqual([
      ".unscoped",
    ]);

    expect(
      ruleSelectors("@supports (x: y) { @media print { .deep { a: b } } }"),
    ).toEqual([".deep"]);
  });

  it("settles the armed rows for print, which has no scroll to reveal them", () => {
    // Without this the method section prints blank whenever the reader has not
    // yet scrolled to it: the copy is in the DOM, at opacity 0, on paper.
    const printBlock = /@media print\s*\{([\s\S]*?)\n\}/.exec(scoped);
    expect(printBlock, "@media print block").not.toBeNull();
    expect(printBlock![1]).toMatch(/\[data-sc-stagger\]\s*>\s*\*/);
    expect(printBlock![1]).toMatch(/opacity:\s*1/);
    expect(printBlock![1]).toMatch(/transform:\s*none/);
  });

  it("keeps the revealed content visible until a live engine drives it", () => {
    // The pre-engine state must be the settled state: no JS, no reveal, no
    // hidden content. Every rule that hides anything is gated on the scope
    // element's own data-scrollcraft-mounted, written by the mount that drives
    // it. `html.sc-ready` is NOT an acceptable gate here: it survives Next.js
    // client-side navigation while the section's DOM does not, so it can outlive
    // the engine instance it stands for and leave rebuilt rows hidden forever.
    for (const block of declarations.split("\n\n")) {
      if (!/opacity:\s*0\b/.test(block)) continue;
      expect(block, "a hiding rule that is not gated on a live mount").toMatch(
        /\[data-scrollcraft-mounted="true"\]/,
      );
      expect(
        block,
        "a hiding rule gated on the document-wide sc-ready",
      ).not.toMatch(/\.sc-ready/);
    }
  });

  it("leaves the reduced-motion floor in base.css unchallenged", () => {
    expect(declarations).not.toMatch(/!important/);
    expect(declarations).not.toMatch(/prefers-reduced-motion/);
  });
});

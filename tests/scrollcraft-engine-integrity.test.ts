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
    const selectors = declarations
      .split("}")
      .flatMap((block) => block.split("{")[0].split(","))
      .map((s) => s.trim())
      .filter(Boolean);

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector, "unscoped scroll-craft selector").toContain(
        "[data-scrollcraft-scope]",
      );
    }
  });

  it("keeps the revealed content visible until the engine is ready", () => {
    // The pre-engine state must be the settled state: no JS, no reveal, no
    // hidden content. Every rule that hides anything is gated on .sc-ready,
    // which the engine adds to <html> at the end of mount().
    for (const block of declarations.split("\n\n")) {
      if (!/opacity:\s*0\b/.test(block)) continue;
      expect(block, "a hiding rule that is not gated on .sc-ready").toMatch(
        /\.sc-ready/,
      );
    }
  });

  it("leaves the reduced-motion floor in base.css unchallenged", () => {
    expect(declarations).not.toMatch(/!important/);
    expect(declarations).not.toMatch(/prefers-reduced-motion/);
  });
});

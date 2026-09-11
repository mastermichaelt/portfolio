import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../app/styles",
);

function reducedMotionBlock(css: string): string {
  const marker = "@media (prefers-reduced-motion: reduce)";
  const start = css.indexOf(marker);
  expect(start, "reduced-motion media query").toBeGreaterThan(-1);

  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }

  throw new Error("unclosed prefers-reduced-motion block");
}

describe("reduced-motion guard", () => {
  it("applies a global duration floor in base.css", () => {
    const baseCss = readFileSync(resolve(stylesDir, "base.css"), "utf8");
    const block = reducedMotionBlock(baseCss).replace(/\s+/g, " ");

    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("does not keep a signature identity stylesheet", () => {
    const globalsCss = readFileSync(
      resolve(stylesDir, "../globals.css"),
      "utf8",
    );

    expect(globalsCss).not.toMatch(/signature\.css/);
  });
});

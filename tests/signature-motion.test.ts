import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const signatureCss = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../app/styles/signature.css",
  ),
  "utf8",
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

describe("signature reduced-motion guard", () => {
  it("disables hover and focus transforms on the hero map", () => {
    const block = reducedMotionBlock(signatureCss).replace(/\s+/g, " ");

    expect(block).toContain(".sys-map-link:hover .sys-map");
    expect(block).toContain(".sys-map-link:hover .sys-map-explore");
    expect(block).toContain(".sys-map-link:focus-visible .sys-map-explore");
    expect(block).toMatch(
      /\.sys-map, \.sys-map-explore \{[^}]*transform: none/,
    );
    expect(block).toMatch(
      /\.sys-map, \.sys-map-explore \{[^}]*transition: none/,
    );
    expect(block).toMatch(
      /\.sys-map-link:hover \.sys-map, \.sys-map-link:hover \.sys-map-explore, \.sys-map-link:focus-visible \.sys-map-explore \{[^}]*transform: none/,
    );
  });
});

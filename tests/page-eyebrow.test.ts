import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const layoutCss = readFileSync(resolve(root, "app/styles/layout.css"), "utf8");

function ruleBody(source: string, selector: string): string {
  const at = source.indexOf(selector);
  expect(at, `selector ${selector}`).toBeGreaterThan(-1);
  const open = source.indexOf("{", at);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

describe("page-level eyebrow colour", () => {
  it(".eyebrow uses muted ink like .label (not accent)", () => {
    const eyebrow = ruleBody(layoutCss, ".eyebrow");
    expect(eyebrow).toMatch(/color:\s*var\(--muted\)/);
    expect(eyebrow).not.toMatch(/color:\s*var\(--accent\)/);

    const label = ruleBody(layoutCss, ".label");
    expect(label).toMatch(/color:\s*var\(--muted\)/);
  });
});

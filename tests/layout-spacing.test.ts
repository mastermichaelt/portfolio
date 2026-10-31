import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = resolve(root, "app/styles");

function css(file: string): string {
  return readFileSync(resolve(stylesDir, file), "utf8");
}

/** First rule body whose selector list contains `selector`. */
function ruleBody(source: string, selector: string): string {
  const at = source.indexOf(selector);
  expect(at, `selector ${selector}`).toBeGreaterThan(-1);
  const open = source.indexOf("{", at);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

describe("page intro spacing (nav-to-content rhythm)", () => {
  it("articles hero uses token top padding, not legacy .hero clamp", () => {
    const hero = ruleBody(css("articles.css"), ".aline-hero");
    expect(hero).toMatch(/padding-block:\s*var\(--gap-xl\)/);
    expect(hero).not.toMatch(/clamp\(72px/);
  });

  it("hero-compact overrides full .hero padding with index rhythm", () => {
    const compact = ruleBody(css("components.css"), ".hero.hero-compact");
    expect(compact).toMatch(
      /padding-block:\s*var\(--gap-xl\)\s*var\(--gap-lg\)/,
    );
  });

  it("dominant index intros share --gap-xl top padding", () => {
    for (const [file, selector] of [
      ["projects.css", ".pindex-hero-section"],
      ["about.css", ".about-shell"],
      ["home.css", ".home2-hero"],
    ] as const) {
      const body = ruleBody(css(file), selector);
      expect(body, `${file} ${selector}`).toMatch(
        /padding-block:[^;]*var\(--gap-xl\)/,
      );
    }
  });
});

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isTheme,
  resolveTheme,
  themeOnSystemChange,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = resolve(root, "app/styles");

function css(file: string): string {
  return readFileSync(resolve(stylesDir, file), "utf8");
}

/** Return the declaration body of the first rule whose selector list contains
 *  `selector` (a literal substring of the selector text). */
function ruleBody(source: string, selector: string): string {
  const at = source.indexOf(selector);
  expect(at, `selector ${selector}`).toBeGreaterThan(-1);
  const open = source.indexOf("{", at);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

describe("resolveTheme", () => {
  it("honours an explicit stored choice over the system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system when there is no stored choice", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme(undefined, true)).toBe("dark");
  });

  it("ignores an invalid stored value and follows the system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("", false)).toBe("light");
    expect(resolveTheme("LIGHT", false)).toBe("light");
  });
});

describe("themeOnSystemChange (live OS-theme change while the page is open)", () => {
  it("follows the system when no explicit choice is stored", () => {
    // No stored preference → the change is applied, tracking the new system value.
    expect(themeOnSystemChange(null, true)).toBe("dark");
    expect(themeOnSystemChange(null, false)).toBe("light");
    expect(themeOnSystemChange(undefined, false)).toBe("light");
  });

  it("does not override an explicit Light or Dark choice", () => {
    // Explicit choice pins the theme → the system change is ignored (null).
    expect(themeOnSystemChange("light", true)).toBeNull();
    expect(themeOnSystemChange("light", false)).toBeNull();
    expect(themeOnSystemChange("dark", true)).toBeNull();
    expect(themeOnSystemChange("dark", false)).toBeNull();
  });

  it("treats an invalid stored value as no preference and follows the system", () => {
    expect(themeOnSystemChange("system", true)).toBe("dark");
    expect(themeOnSystemChange("", false)).toBe("light");
  });
});

describe("isTheme", () => {
  it("accepts only the two concrete themes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("theme.css palettes", () => {
  const theme = css("theme.css");

  it("declares both theme scopes", () => {
    expect(theme).toContain('[data-theme="dark"]');
    expect(theme).toContain('[data-theme="light"]');
  });

  it("keeps the dark baseline values", () => {
    const dark = ruleBody(theme, '[data-theme="dark"]');
    expect(dark).toMatch(/--bg:\s*#121110/);
    expect(dark).toMatch(/--fg:\s*#ece9e2/);
    expect(dark).toMatch(/--accent:\s*#d9a441/);
    expect(dark).toMatch(/--accent-fill:\s*#d9a441/);
    expect(dark).toMatch(/color-scheme:\s*dark/);
  });

  it("uses the approved warm light palette with an ochre ink accent", () => {
    const light = ruleBody(theme, '[data-theme="light"]');
    expect(light).toMatch(/--bg:\s*#f2efe8/);
    expect(light).toMatch(/--surface:\s*#f8f6f1/);
    expect(light).toMatch(/--fg:\s*#1b1a18/);
    expect(light).toMatch(/--muted:\s*#67635b/); // contrast floor
    // Ink relights to ochre; fill stays the brand amber.
    expect(light).toMatch(/--accent:\s*#865d0d/);
    expect(light).toMatch(/--accent-fill:\s*#d9a441/);
    expect(light).toMatch(/color-scheme:\s*light/);
  });
});

describe("tokens.css accent roles", () => {
  const tokens = css("tokens.css");
  const rootBody = ruleBody(tokens, ":root");

  it("keeps the dark baseline on :root so an unthemed document is unchanged", () => {
    expect(rootBody).toMatch(/--bg:\s*#121110/);
    expect(rootBody).toMatch(/--accent:\s*#d9a441/);
    expect(rootBody).toMatch(/color-scheme:\s*dark/);
  });

  it("declares --accent-fill and derives --accent-soft from it", () => {
    expect(rootBody).toMatch(/--accent-fill:\s*var\(--accent\)/);
    expect(rootBody).toMatch(
      /--accent-soft:\s*color-mix\(in oklch,\s*var\(--accent-fill\)/,
    );
  });
});

describe("accent-role consumers use the fill role", () => {
  it(".btn-primary fills with --accent-fill", () => {
    const btn = ruleBody(css("components.css"), ".btn-primary {");
    expect(btn).toMatch(/background:\s*var\(--accent-fill\)/);
    expect(btn).toMatch(/border-color:\s*var\(--accent-fill\)/);
    expect(btn).not.toMatch(/background:\s*var\(--accent\)\s*;/);
  });

  it(".line-chip.is-selected fills with --accent-fill (not the ink accent)", () => {
    const chip = ruleBody(css("ecosystem.css"), ".line-chip.is-selected");
    expect(chip).toMatch(/background:\s*var\(--accent-fill\)/);
    expect(chip).toMatch(/border-color:\s*var\(--accent-fill\)/);
    expect(chip).not.toMatch(/background:\s*var\(--accent\)\s*;/);
  });
});

describe("globals.css wiring", () => {
  const globals = readFileSync(resolve(root, "app/globals.css"), "utf8");

  it("imports theme.css immediately after tokens.css", () => {
    const tokensAt = globals.indexOf('@import "./styles/tokens.css"');
    const themeAt = globals.indexOf('@import "./styles/theme.css"');
    expect(tokensAt).toBeGreaterThan(-1);
    expect(themeAt).toBeGreaterThan(tokensAt);
    expect(globals).toContain('@import "./styles/theme-control.css"');
  });
});

describe("theme-control.css ships only Treatment D", () => {
  const control = css("theme-control.css");

  it("contains the approved Treatment D pieces", () => {
    for (const selector of [
      ".topnav-end",
      ".theme-switch",
      ".theme-switch-label",
      ".theme-hit",
      ".theme-switch-row",
    ]) {
      expect(control, selector).toContain(selector);
    }
  });

  it("discards the rejected treatments A–C and their placement rows", () => {
    for (const selector of [
      ".theme-seg",
      ".theme-cycle",
      ".theme-select",
      ".theme-row-label",
    ]) {
      expect(control, selector).not.toContain(selector);
    }
  });

  it("keeps the focus ring on the switch controls", () => {
    expect(control).toMatch(
      /:focus-visible\s*{[^}]*outline:\s*2px solid var\(--accent\)/,
    );
  });
});

describe("shared theme constants", () => {
  it("uses the documented storage key and attribute", () => {
    expect(THEME_STORAGE_KEY).toBe("theme");
    expect(THEME_ATTRIBUTE).toBe("data-theme");
  });
});

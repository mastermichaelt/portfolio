import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("web manifest", () => {
  it("returns identity metadata with browser display and a single 192 icon", async () => {
    const manifest = (await import("@/app/manifest")).default;
    const result = manifest();

    expect(result.display).toBe("browser");
    expect(result.start_url).toBe("/");
    expect(result.background_color).toBe("#121110");
    expect(result.theme_color).toBe("#121110");
    expect(result.name).toBe(
      "Michael Truong · Making uncertain systems dependable",
    );
    expect(result.short_name).toBe("Michael Truong");
    expect(result.description).toContain("Michael Truong");
    expect(result.icons).toHaveLength(1);
    expect(result.icons?.[0]).toEqual({
      src: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    });
    expect(existsSync(resolve(root, "public/android-chrome-192x192.png"))).toBe(
      true,
    );
  });
});

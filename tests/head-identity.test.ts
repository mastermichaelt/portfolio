import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

vi.mock("@/lib/fonts", () => ({
  ibmPlexSans: { variable: "--font-body" },
  ibmPlexMono: { variable: "--font-mono" },
}));

vi.mock("@/lib/portfolio", () => ({
  getPortfolioRepository: () => ({
    getProfile: async () => ({
      name: "Michael Truong",
      email: "michael@multipliers.dev",
    }),
  }),
}));

describe("head identity metadata", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("does not ship the scaffold app/favicon.ico", () => {
    expect(existsSync(resolve(root, "app/favicon.ico"))).toBe(false);
  });

  it("wires favicon and apple-touch-icon through metadata.icons", async () => {
    const { metadata } = await import("@/app/layout");

    expect(metadata.icons).toEqual({
      icon: [{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    });

    for (const href of [
      "/favicon-32x32.png",
      "/apple-touch-icon.png",
    ] as const) {
      expect(existsSync(resolve(root, "public", href.slice(1)))).toBe(true);
    }
  });

  it("exports dual-media themeColor and colorScheme viewport metadata", async () => {
    const { viewport } = await import("@/app/layout");

    expect(viewport).toEqual({
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
        { media: "(prefers-color-scheme: dark)", color: "#121110" },
      ],
      colorScheme: "dark light",
    });
  });

  it("does not duplicate icon wiring via app/icon or app/apple-icon files", () => {
    expect(existsSync(resolve(root, "app/icon.png"))).toBe(false);
    expect(existsSync(resolve(root, "app/apple-icon.png"))).toBe(false);

    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/app\/icon\.(png|ico|jpg|jpeg|svg)/);
    expect(layout).not.toMatch(/app\/apple-icon\.(png|jpg|jpeg)/);
  });
});

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SITE_WEB_MANIFEST,
  SITE_WEB_MANIFEST_PATH,
} from "@/lib/site-web-manifest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

vi.mock("@/lib/fonts", () => ({
  ibmPlexSans: { variable: "--font-body" },
  ibmPlexMono: { variable: "--font-mono" },
}));

describe("web manifest", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("ships manifest.webmanifest aligned with lib/site-web-manifest constants", () => {
    const manifestPath = resolve(root, "public/manifest.webmanifest");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      unknown
    >;

    expect(manifest).toEqual({
      ...SITE_WEB_MANIFEST,
      icons: SITE_WEB_MANIFEST.icons.map((icon) => ({ ...icon })),
    });
  });

  it("wires root layout metadata.manifest to the static site manifest", async () => {
    const { metadata } = await import("@/app/layout");
    expect(metadata.manifest).toBe(SITE_WEB_MANIFEST_PATH);
  });

  it("references a single 192 launcher icon on disk", () => {
    expect(existsSync(resolve(root, "public/android-chrome-192x192.png"))).toBe(
      true,
    );
  });
});

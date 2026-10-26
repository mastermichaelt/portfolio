import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONNECT_MANIFEST_BACKGROUND_COLOR,
  CONNECT_MANIFEST_DISPLAY,
  CONNECT_MANIFEST_ICONS,
  CONNECT_MANIFEST_ID,
  CONNECT_MANIFEST_NAME,
  CONNECT_MANIFEST_PATH,
  CONNECT_MANIFEST_SCOPE,
  CONNECT_MANIFEST_SHORT_NAME,
  CONNECT_MANIFEST_START_URL,
  CONNECT_MANIFEST_THEME_COLOR,
  CONNECT_PAGE_DESCRIPTION,
} from "@/lib/connect";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  expect(buffer.length).toBeGreaterThanOrEqual(24);
  expect(buffer.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe("connect web manifest", () => {
  it("ships connect.webmanifest aligned with lib/connect constants", () => {
    const manifestPath = resolve(root, "public/connect.webmanifest");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      unknown
    >;

    expect(manifest).toEqual({
      id: CONNECT_MANIFEST_ID,
      name: CONNECT_MANIFEST_NAME,
      short_name: CONNECT_MANIFEST_SHORT_NAME,
      description: CONNECT_PAGE_DESCRIPTION,
      start_url: CONNECT_MANIFEST_START_URL,
      scope: CONNECT_MANIFEST_SCOPE,
      display: CONNECT_MANIFEST_DISPLAY,
      background_color: CONNECT_MANIFEST_BACKGROUND_COLOR,
      theme_color: CONNECT_MANIFEST_THEME_COLOR,
      icons: CONNECT_MANIFEST_ICONS.map((icon) => ({ ...icon })),
    });
  });

  it("ships 192 and 512 connect launcher icons on disk", () => {
    const expected = [
      { file: "public/connect-icon-192.png", width: 192, height: 192 },
      { file: "public/connect-icon-512.png", width: 512, height: 512 },
    ] as const;

    for (const icon of expected) {
      const absolutePath = resolve(root, icon.file);
      expect(existsSync(absolutePath)).toBe(true);

      const buffer = readFileSync(absolutePath);
      const { width, height } = readPngDimensions(buffer);
      expect(width).toBe(icon.width);
      expect(height).toBe(icon.height);
      expect(statSync(absolutePath).size).toBeGreaterThan(4_000);
    }
  });

  it("wires connect layout metadata.manifest to the static manifest", async () => {
    const { metadata } = await import("@/app/connect/layout");
    expect(metadata.manifest).toBe(CONNECT_MANIFEST_PATH);
  });

  it("does not register a service worker for connect", () => {
    const layout = readFileSync(
      resolve(root, "app/connect/layout.tsx"),
      "utf8",
    );
    expect(layout).not.toMatch(/serviceWorker|navigator\.serviceWorker/);
    expect(existsSync(resolve(root, "public/sw.js"))).toBe(false);
  });
});

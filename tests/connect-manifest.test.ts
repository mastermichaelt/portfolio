import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONNECT_MANIFEST_PATH, CONNECT_WEB_MANIFEST } from "@/lib/connect";

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
      ...CONNECT_WEB_MANIFEST,
      icons: CONNECT_WEB_MANIFEST.icons.map((icon) => ({ ...icon })),
    });
  });

  it("ships connect launcher icons on disk", () => {
    const expected = [
      { file: "public/connect-icon-192.png", width: 192, height: 192 },
      { file: "public/connect-icon-512.png", width: 512, height: 512 },
      {
        file: "public/connect-icon-maskable-512.png",
        width: 512,
        height: 512,
      },
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

  it("ships maskable 512 icon from the same approved crop as the any 512 icon", () => {
    const any512 = readFileSync(resolve(root, "public/connect-icon-512.png"));
    const maskable512 = readFileSync(
      resolve(root, "public/connect-icon-maskable-512.png"),
    );
    expect(maskable512.equals(any512)).toBe(true);
  });

  it("wires connect layout metadata.manifest to the static manifest", async () => {
    const { metadata } = await import("@/app/connect/layout");
    expect(metadata.manifest).toBe(CONNECT_MANIFEST_PATH);
  });

  it("does not add service worker wiring for the connect route", () => {
    const connectDir = resolve(root, "app/connect");
    for (const file of readdirSync(connectDir)) {
      const content = readFileSync(resolve(connectDir, file), "utf8");
      expect(content).not.toMatch(
        /serviceWorker|navigator\.serviceWorker|serwist/i,
      );
    }

    const nextConfig = readFileSync(resolve(root, "next.config.ts"), "utf8");
    expect(nextConfig).not.toMatch(/serwist|serviceWorker/i);
    expect(existsSync(resolve(root, "public/sw.js"))).toBe(false);
  });
});

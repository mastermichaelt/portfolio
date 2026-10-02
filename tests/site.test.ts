import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadSite() {
    return import("@/lib/site");
  }

  it("defaults to https://michaeltruong.ai", async () => {
    const { getSiteUrl } = await loadSite();
    expect(getSiteUrl()).toBe("https://michaeltruong.ai");
  });

  it("reads NEXT_PUBLIC_SITE_URL when set to an HTTPS origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.test");
    const { getSiteUrl } = await loadSite();
    expect(getSiteUrl()).toBe("https://preview.example.test");
  });

  it("normalizes env values to the origin only", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SITE_URL",
      "https://michaeltruong.ai/about?ref=test",
    );
    const { getSiteUrl } = await loadSite();
    expect(getSiteUrl()).toBe("https://michaeltruong.ai");
  });

  it("falls back when the env value is not HTTPS", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://michaeltruong.ai");
    const { getSiteUrl } = await loadSite();
    expect(getSiteUrl()).toBe("https://michaeltruong.ai");
  });

  it("falls back when the env value is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");
    const { getSiteUrl } = await loadSite();
    expect(getSiteUrl()).toBe("https://michaeltruong.ai");
  });
});

describe("getSiteHostname", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns michaeltruong.ai by default", async () => {
    const { getSiteHostname } = await import("@/lib/site");
    expect(getSiteHostname()).toBe("michaeltruong.ai");
  });
});

describe("layout metadataBase", () => {
  it("wires metadataBase to getSiteUrl()", () => {
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    expect(layout).toContain("metadataBase: new URL(getSiteUrl())");
  });

  it("resolves to michaeltruong.ai by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
    const { getSiteUrl } = await import("@/lib/site");
    expect(new URL(getSiteUrl()).hostname).toBe("michaeltruong.ai");
  });
});

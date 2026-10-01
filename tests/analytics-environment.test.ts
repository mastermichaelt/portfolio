import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("resolveAnalyticsEnvironment", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", {
      location: { hostname: "michaeltruong.ai" },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function resolveEnv() {
    const { resolveAnalyticsEnvironment } =
      await import("@/lib/analyticsEnvironment");
    return resolveAnalyticsEnvironment();
  }

  it("returns e2e on Playwright host 127.0.0.1", async () => {
    vi.stubGlobal("window", {
      location: { hostname: "127.0.0.1" },
    });
    expect(await resolveEnv()).toBe("e2e");
  });

  it("returns local during Next.js development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
    });
    expect(await resolveEnv()).toBe("local");
  });

  it("returns local during development even when Vercel env is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
    });
    expect(await resolveEnv()).toBe("local");
  });

  it("returns preview for Vercel preview builds", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    expect(await resolveEnv()).toBe("preview");
  });

  it("returns production for Vercel production builds", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    expect(await resolveEnv()).toBe("production");
  });

  it("returns production for the production hostname at runtime", async () => {
    vi.stubGlobal("window", {
      location: { hostname: "michaeltruong.ai" },
    });
    expect(await resolveEnv()).toBe("production");
  });

  it("falls back to preview for unknown deploy hosts", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "portfolio-git-feat-posthog-multipliers-dev.vercel.app",
      },
    });
    expect(await resolveEnv()).toBe("preview");
  });
});

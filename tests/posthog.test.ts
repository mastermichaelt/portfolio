import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const init = vi.fn();
const register = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init,
    capture,
    register,
  },
}));

describe("posthog init and capture guards", () => {
  beforeEach(() => {
    capture.mockClear();
    init.mockClear();
    register.mockClear();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", {
      location: { hostname: "michaeltruong.ai" },
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("skips init and capture when the project token is missing", async () => {
    const { initPosthog, captureEvent } = await import("@/lib/posthog");
    initPosthog();
    captureEvent("outbound_link", { href: "https://example.com" });

    expect(init).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("skips init and capture when the project token is blank", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "   ");
    const { initPosthog, captureEvent } = await import("@/lib/posthog");
    initPosthog();
    captureEvent("outbound_link", { href: "https://example.com" });

    expect(init).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("initializes PostHog with privacy-safe defaults and registers analytics_environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const { initPosthog } = await import("@/lib/posthog");
    initPosthog();

    expect(init).toHaveBeenCalledOnce();
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
        defaults: "2026-05-30",
        autocapture: false,
        disable_session_recording: true,
      }),
    );
    expect(register).toHaveBeenCalledWith({
      analytics_environment: "production",
    });
  });

  it("defaults api_host when NEXT_PUBLIC_POSTHOG_HOST is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");

    const { initPosthog } = await import("@/lib/posthog");
    initPosthog();

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
      }),
    );
  });

  it("captures custom events when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");

    const { captureEvent } = await import("@/lib/posthog");
    captureEvent("outbound_link", {
      href: "https://example.com",
      link_label: "Example",
    });

    expect(capture).toHaveBeenCalledWith("outbound_link", {
      href: "https://example.com",
      link_label: "Example",
    });
  });
});

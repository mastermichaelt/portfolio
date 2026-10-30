import { describe, expect, it, vi } from "vitest";

import {
  ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION,
  buildAssistantPageMetadata,
} from "@/lib/assistant/page-metadata";

describe("assistant page generateMetadata", () => {
  it("uses maintenance metadata when public generation is disabled and API env is invalid", async () => {
    vi.stubEnv("ASSISTANT_PUBLIC_ENABLED", "false");
    vi.stubEnv("ASSISTANT_API_MAX_BODY_BYTES", "not-a-number");

    vi.resetModules();
    const { generateMetadata } = await import("@/app/(site)/assistant/page");
    const metadata = await generateMetadata();

    expect(metadata.description).toBe(ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(
      ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION,
    );

    vi.unstubAllEnvs();
  });
});

describe("assistant page public flag", () => {
  it("resolves maintenance view without reading invalid API configuration", async () => {
    vi.stubEnv("ASSISTANT_PUBLIC_ENABLED", "false");
    vi.stubEnv("ASSISTANT_API_MAX_BODY_BYTES", "not-a-number");

    const { resolveAssistantPublicEnabled } =
      await import("@/lib/assistant/api/config");
    expect(resolveAssistantPublicEnabled()).toBe(false);
    expect(buildAssistantPageMetadata(false).description).toBe(
      ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION,
    );

    vi.unstubAllEnvs();
  });
});

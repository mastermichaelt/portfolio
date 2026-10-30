import { describe, expect, it } from "vitest";

import {
  ASSISTANT_PUBLIC_DISABLED_MESSAGE,
  AssistantPublicEnabledConfigError,
  resolveAssistantApiConfig,
  resolveAssistantPublicEnabled,
} from "@/lib/assistant/api/config";
import {
  ASSISTANT_PAGE_ENABLED_DESCRIPTION,
  ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION,
  buildAssistantPageMetadata,
} from "@/lib/assistant/page-metadata";

const envWithInvalidApiBodyLimit = {
  ...process.env,
  ASSISTANT_PUBLIC_ENABLED: "false",
  ASSISTANT_API_MAX_BODY_BYTES: "not-a-number",
};

describe("resolveAssistantPublicEnabled", () => {
  it("defaults to enabled when ASSISTANT_PUBLIC_ENABLED is unset", () => {
    expect(
      resolveAssistantPublicEnabled({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: undefined,
      }),
    ).toBe(true);
  });

  it("rejects explicitly empty or whitespace-only values", () => {
    for (const value of ["", "   ", "\t"]) {
      expect(() =>
        resolveAssistantPublicEnabled({
          ...process.env,
          ASSISTANT_PUBLIC_ENABLED: value,
        }),
      ).toThrow(AssistantPublicEnabledConfigError);
    }
  });

  it("trims surrounding whitespace on documented values", () => {
    expect(
      resolveAssistantPublicEnabled({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "  false  ",
      }),
    ).toBe(false);
  });

  it("parses documented disabled values case-insensitively", () => {
    for (const value of ["0", "false", "no", "FALSE", "NO"]) {
      expect(
        resolveAssistantPublicEnabled({
          ...process.env,
          ASSISTANT_PUBLIC_ENABLED: value,
        }),
      ).toBe(false);
    }
  });

  it("parses documented enabled values case-insensitively", () => {
    for (const value of ["1", "true", "yes", "TRUE", "YES"]) {
      expect(
        resolveAssistantPublicEnabled({
          ...process.env,
          ASSISTANT_PUBLIC_ENABLED: value,
        }),
      ).toBe(true);
    }
  });

  it("rejects unrecognized non-empty values", () => {
    expect(() =>
      resolveAssistantPublicEnabled({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "flase",
      }),
    ).toThrow(AssistantPublicEnabledConfigError);
  });

  it("does not validate unrelated API configuration", () => {
    expect(resolveAssistantPublicEnabled(envWithInvalidApiBodyLimit)).toBe(
      false,
    );
    expect(() => resolveAssistantApiConfig(envWithInvalidApiBodyLimit)).toThrow(
      /ASSISTANT_API_MAX_BODY_BYTES/,
    );
  });
});

describe("resolveAssistantApiConfig publicEnabled", () => {
  it("reuses resolveAssistantPublicEnabled", () => {
    expect(
      resolveAssistantApiConfig({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "false",
      }).publicEnabled,
    ).toBe(false);
  });
});

describe("buildAssistantPageMetadata", () => {
  it("uses enabled copy when public generation is on", () => {
    const metadata = buildAssistantPageMetadata(true);
    expect(metadata.description).toBe(ASSISTANT_PAGE_ENABLED_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(
      ASSISTANT_PAGE_ENABLED_DESCRIPTION,
    );
    expect(metadata.alternates?.canonical).toBe("/assistant");
  });

  it("uses maintenance copy when public generation is off", () => {
    const metadata = buildAssistantPageMetadata(false);
    expect(metadata.description).toBe(ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(
      ASSISTANT_PAGE_MAINTENANCE_DESCRIPTION,
    );
    expect(metadata.description).not.toBe(ASSISTANT_PAGE_ENABLED_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe("/assistant");
  });
});

describe("ASSISTANT_PUBLIC_DISABLED_MESSAGE", () => {
  it("is non-empty visitor-safe copy", () => {
    expect(ASSISTANT_PUBLIC_DISABLED_MESSAGE.length).toBeGreaterThan(20);
    expect(ASSISTANT_PUBLIC_DISABLED_MESSAGE).not.toMatch(
      /DATABASE_URL|OPENAI/i,
    );
  });
});

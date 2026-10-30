import { describe, expect, it } from "vitest";

import {
  ASSISTANT_PUBLIC_DISABLED_MESSAGE,
  resolveAssistantApiConfig,
} from "@/lib/assistant/api/config";

describe("resolveAssistantApiConfig publicEnabled", () => {
  it("defaults to enabled when ASSISTANT_PUBLIC_ENABLED is unset", () => {
    expect(
      resolveAssistantApiConfig({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: undefined,
      }).publicEnabled,
    ).toBe(true);
  });

  it("disables public generation when ASSISTANT_PUBLIC_ENABLED is false", () => {
    expect(
      resolveAssistantApiConfig({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "false",
      }).publicEnabled,
    ).toBe(false);
    expect(
      resolveAssistantApiConfig({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "0",
      }).publicEnabled,
    ).toBe(false);
  });

  it("enables public generation for explicit true values", () => {
    expect(
      resolveAssistantApiConfig({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "true",
      }).publicEnabled,
    ).toBe(true);
    expect(
      resolveAssistantApiConfig({
        ...process.env,
        ASSISTANT_PUBLIC_ENABLED: "1",
      }).publicEnabled,
    ).toBe(true);
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

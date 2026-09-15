import { describe, expect, it, vi } from "vitest";

// ExternalLink pulls in captureEvent -> posthog-js; mock it so importing the
// module in the node test environment has no side effects. We only exercise the
// pure label helper, never the component or captureEvent.
vi.mock("posthog-js", () => ({
  default: { init: vi.fn(), capture: vi.fn(), register: vi.fn() },
}));

import { resolveOutboundLabel } from "@/components/ExternalLink";

describe("resolveOutboundLabel — outbound_link analytics label", () => {
  it("uses an explicit analyticsLabel verbatim, so a richer accessible name does not shift analytics", () => {
    const title = "The board came back. The highlights lied.";
    // The archive-row case: aria-label carries the paired system, analytics stays the title.
    expect(resolveOutboundLabel(title, title, `${title} — Codenames AI`)).toBe(
      title,
    );
  });

  it("trims an explicit analyticsLabel", () => {
    expect(resolveOutboundLabel("  Report title  ", "child", "aria")).toBe(
      "Report title",
    );
  });

  it("falls back to the accessible name (minus the new-tab hint) when no analyticsLabel is given", () => {
    expect(resolveOutboundLabel(undefined, "child", "Aria name")).toBe(
      "Aria name",
    );
  });

  it("treats a blank analyticsLabel as absent and derives the label from children", () => {
    expect(resolveOutboundLabel("   ", "Child label", undefined)).toBe(
      "Child label",
    );
  });

  it("returns undefined when there is nothing to label", () => {
    expect(resolveOutboundLabel(undefined, null, undefined)).toBeUndefined();
  });
});

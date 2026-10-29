import { describe, expect, it } from "vitest";

import {
  EVALUATION_REMOVAL_REQUEST_PATH,
  formatEvaluationDisclosureCopy,
  resolveEvaluationDisclosurePresentation,
} from "@/lib/assistant/evaluation/disclosure-copy";

describe("formatEvaluationDisclosureCopy", () => {
  it("states when collection is disabled", () => {
    expect(formatEvaluationDisclosureCopy({ enabled: false })).toContain(
      "are not stored",
    );
  });

  it("uses retention-neutral copy when enabled", () => {
    expect(formatEvaluationDisclosureCopy({ enabled: true })).toBe(
      "Questions and responses may be stored to improve this assistant. You can request their removal.",
    );
  });

  it("links removal requests to the about contact surface", () => {
    expect(EVALUATION_REMOVAL_REQUEST_PATH).toBe("/about");
    expect(resolveEvaluationDisclosurePresentation({ enabled: true })).toEqual({
      kind: "link",
      lead: "Questions and responses may be stored to improve this assistant. You can ",
      linkHref: "/about",
      linkLabel: "request their removal",
      trail: ".",
    });
  });
});

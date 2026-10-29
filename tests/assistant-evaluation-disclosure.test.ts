import { describe, expect, it } from "vitest";

import { formatEvaluationDisclosureCopy } from "@/lib/assistant/evaluation/disclosure-copy";

describe("formatEvaluationDisclosureCopy", () => {
  it("states when collection is disabled", () => {
    expect(
      formatEvaluationDisclosureCopy({ enabled: false, retentionDays: 30 }),
    ).toContain("are not stored");
  });

  it("uses configured retention days when enabled", () => {
    expect(
      formatEvaluationDisclosureCopy({ enabled: true, retentionDays: 14 }),
    ).toContain("14 days");
  });

  it("uses singular copy for one-day retention", () => {
    expect(
      formatEvaluationDisclosureCopy({ enabled: true, retentionDays: 1 }),
    ).toContain("1 day");
  });
});

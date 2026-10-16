import { describe, expect, it } from "vitest";

import { repairAssistantModelGenerationJson } from "@/scripts/assistant/generation/repair-model-response.mjs";
import { parseAssistantModelGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";
import { validateStructuralModelResponse } from "@/scripts/assistant/generation/validate-response.mjs";

const emptyPacket = {
  assembly_mode: "top_k_only" as const,
  matched_hits: [],
  entries: [],
  character_budget: 10_000,
  character_count: 0,
  truncated: false,
};

describe("repairAssistantModelGenerationJson", () => {
  it("maps abstained=true claims with attribution abstained to uncertain", () => {
    const raw = {
      claims: [
        {
          text: "I cannot share salary or employer-specific compensation details.",
          attribution: "abstained",
        },
      ],
      support_level: "none",
      abstained: true,
      abstention_reason: "unsupported_personal_claim",
    };

    const repaired = repairAssistantModelGenerationJson(raw);
    const parsed = parseAssistantModelGenerationResponse(repaired);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.claims[0].attribution).toBe("uncertain");
    expect(parsed.value.claims[0].citations).toBeUndefined();

    const validation = validateStructuralModelResponse(
      parsed.value,
      emptyPacket,
    );
    expect(validation.valid).toBe(true);
  });

  it("maps abstention_reason values mistakenly used as attribution when abstained", () => {
    const raw = {
      claims: [
        {
          text: "That information is not available in the portfolio corpus.",
          attribution: "policy_refusal",
        },
      ],
      support_level: "none",
      abstained: true,
      abstention_reason: "policy_refusal",
    };

    const repaired = repairAssistantModelGenerationJson(raw);
    const parsed = parseAssistantModelGenerationResponse(repaired);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.claims[0].attribution).toBe("uncertain");
    }
  });

  it("does not repair invalid attribution when abstained is false", () => {
    const raw = {
      claims: [{ text: "Guess.", attribution: "abstained" }],
      support_level: "none",
      abstained: false,
    };

    const repaired = repairAssistantModelGenerationJson(raw);
    const parsed = parseAssistantModelGenerationResponse(repaired);
    expect(parsed.ok).toBe(false);
  });
});

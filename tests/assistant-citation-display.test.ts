import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildEvidenceDisplayByCitationKey,
  lookupCitationDisplay,
  resolveCitationDisplayForEntry,
} from "@/lib/assistant/api/citation-display";
import { buildPublicAnswer } from "@/lib/assistant/api/public-envelope";
import type { AssistantGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";

function loadPacketFixture(name: string) {
  const file = path.join(
    process.cwd(),
    "tests/fixtures/assistant-generation/packets",
    name,
  );
  return JSON.parse(readFileSync(file, "utf8")) as {
    entries: Array<{
      evidence_id: string;
      unit_id: string;
      okf_concept_id: string;
      title?: string;
      resource?: string;
      sources?: unknown;
    }>;
  };
}

describe("resolveCitationDisplayForEntry", () => {
  it("uses evidence entry title and resource, not claim prose URLs", () => {
    const savepoints = loadPacketFixture("savepoints-top-k-only.json");
    const entry = savepoints.entries[0]!;

    const display = resolveCitationDisplayForEntry(entry);

    expect(display.source_label).toBe("Savepoints durable capture");
    expect(display.source_url).toBe(
      "https://michaeltruong.ai/projects/savepoints",
    );
  });

  it("omits source_url when no specific public destination exists", () => {
    const display = resolveCitationDisplayForEntry({
      evidence_id: "E9",
      unit_id: "unit/career/internal-notes",
      okf_concept_id: "career/internal-notes",
      title: "Internal career notes",
    });

    expect(display.source_label).toBe("Internal career notes");
    expect(display.source_url).toBeUndefined();
  });

  it("does not expose generic portfolio listing pages as citation destinations", () => {
    const display = resolveCitationDisplayForEntry({
      evidence_id: "E2",
      unit_id: "unit/writing/index",
      okf_concept_id: "writing/index",
      title: "Articles index",
      resource: "https://michaeltruong.ai/articles",
    });

    expect(display.source_label).toBe("Articles index");
    expect(display.source_url).toBeUndefined();
  });
});

describe("buildPublicAnswer citation enrichment", () => {
  it("maps each citation to its evidence entry regardless of URLs in claim text", () => {
    const savepoints = loadPacketFixture("savepoints-top-k-only.json");
    const codenames = loadPacketFixture("codenames-top-k-only.json");
    const displayByKey = buildEvidenceDisplayByCitationKey([
      ...savepoints.entries,
      ...codenames.entries,
    ]);

    const response: AssistantGenerationResponse = {
      claims: [
        {
          text: "Savepoints captures learnings. Also see https://codenames-ai.com.",
          attribution: "evidence_supported",
          citations: [
            {
              evidence_id: "E1",
              unit_id: savepoints.entries[0]!.unit_id,
            },
            {
              evidence_id: "E1",
              unit_id: codenames.entries[0]!.unit_id,
            },
          ],
        },
      ],
      answer_text:
        "Savepoints captures learnings. Also see https://codenames-ai.com.",
      citations: [
        {
          evidence_id: "E1",
          unit_id: savepoints.entries[0]!.unit_id,
        },
        {
          evidence_id: "E1",
          unit_id: codenames.entries[0]!.unit_id,
        },
      ],
      support_level: "partial",
      abstained: false,
    };

    const answer = buildPublicAnswer(response, displayByKey);
    const savepointsCitation = answer.claims[0]!.citations![0]!;
    const codenamesCitation = answer.claims[0]!.citations![1]!;

    expect(savepointsCitation.source_label).toBe("Savepoints durable capture");
    expect(savepointsCitation.source_url).toBe(
      "https://michaeltruong.ai/projects/savepoints",
    );
    expect(codenamesCitation.source_label).toBe(
      "Judge and validation pipeline",
    );
    expect(codenamesCitation.source_url).toBe("https://codenames-ai.com");
  });

  it("lookup is keyed by evidence_id and unit_id together", () => {
    const savepoints = loadPacketFixture("savepoints-top-k-only.json");
    const displayByKey = buildEvidenceDisplayByCitationKey(savepoints.entries);

    expect(
      lookupCitationDisplay(displayByKey, "E1", savepoints.entries[0]!.unit_id)
        ?.source_label,
    ).toBe("Savepoints durable capture");
    expect(
      lookupCitationDisplay(displayByKey, "E1", "unit/wrong"),
    ).toBeUndefined();
  });
});

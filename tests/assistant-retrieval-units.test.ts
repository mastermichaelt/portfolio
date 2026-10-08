import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildOkfCorpus } from "@/scripts/assistant/okf/build.mjs";
import { listConceptFiles } from "@/scripts/assistant/okf/manifest.mjs";
import { renderConcept } from "@/scripts/assistant/okf/writer.mjs";
import { producePortfolioConcepts } from "@/scripts/assistant/okf/portfolio-producer.mjs";
import {
  chunkOkfBody,
  MAX_CHUNK_ESTIMATED_TOKENS,
  slugifyHeading,
  splitBodyIntoParagraphs,
  unitIdForChunk,
} from "@/scripts/assistant/retrieval/chunk-okf-body.mjs";
import {
  composeRetrievalText,
  deriveRetrievalUnits,
  deriveUnitsFromConcept,
  sourceClassFromConceptId,
} from "@/scripts/assistant/retrieval/derive-units.mjs";
import {
  parseOkfFrontmatter,
  readOkfConceptFile,
} from "@/scripts/assistant/retrieval/parse-okf-concept.mjs";

const EXPECTED_CONCEPT_COUNT = 35;

describe("OKF frontmatter parsing", () => {
  it("parses nested sources, tags, and generated blocks", () => {
    const yaml = `type: Published Article Metadata
title: Sample title
resource: "https://example.com/article"
sources:
  -
    id: "dev-article-1"
    title: Sample title
    resource: "https://example.com/article"
  -
    id: "portfolio-articles-index"
    title: Portfolio articles index
    resource: "https://example.com/articles"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - writing
  - metadata`;

    const parsed = parseOkfFrontmatter(yaml);
    expect(parsed.type).toBe("Published Article Metadata");
    expect(parsed.title).toBe("Sample title");
    expect(parsed.resource).toBe("https://example.com/article");
    expect(parsed.sources).toHaveLength(2);
    expect(parsed.sources[0]).toEqual({
      id: "dev-article-1",
      title: "Sample title",
      resource: "https://example.com/article",
    });
    expect(parsed.generated).toEqual({ by: "process:portfolio-okf-producer" });
    expect(parsed.tags).toEqual(["writing", "metadata"]);
  });
});

describe("structure-aware OKF body chunking", () => {
  it("slugifies section headings for stable unit_id suffixes", () => {
    expect(slugifyHeading("The review gate was right")).toBe(
      "the-review-gate-was-right",
    );
  });

  it("keeps short single-section bodies as one chunk", () => {
    const chunks = chunkOkfBody("One paragraph.\n\nSecond paragraph.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.partKey).toBe("intro");
  });

  it("splits on markdown headings into multiple chunks", () => {
    const body = `Intro paragraph.

## Alpha section

Alpha body.

## Beta section

Beta body.`;

    const chunks = chunkOkfBody(body);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.some((chunk) => chunk.partKey === "intro")).toBe(true);
    expect(chunks.some((chunk) => chunk.partKey === "alpha-section")).toBe(
      true,
    );
    expect(chunks.some((chunk) => chunk.partKey === "beta-section")).toBe(true);
  });

  it("assigns unit_id without hash for a single chunk", () => {
    const chunks = chunkOkfBody("Only content.");
    expect(unitIdForChunk("writing/sample", chunks, 0)).toBe(
      "unit/writing/sample",
    );
  });

  it("assigns hashed unit_id suffixes when multiple chunks exist", () => {
    const chunks = chunkOkfBody(`## One\n\nA.\n\n## Two\n\nB.`);
    expect(chunks.length).toBeGreaterThan(1);
    expect(unitIdForChunk("writing/sample", chunks, 0)).toBe(
      "unit/writing/sample#one",
    );
    expect(unitIdForChunk("writing/sample", chunks, 1)).toMatch(
      /^unit\/writing\/sample#/,
    );
  });

  it("does not duplicate an oversized paragraph when packing prior paragraphs", () => {
    const small = "A".repeat(100);
    const huge = "B".repeat(MAX_CHUNK_ESTIMATED_TOKENS * 4 + 100);
    const chunks = chunkOkfBody(`${small}\n\n${huge}`);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.body).toBe(small);
    expect(chunks[1]!.body).toBe(huge);

    const bodies = chunks.map((chunk) => chunk.body);
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it.each([
    ["backtick", "```"],
    ["tilde", "~~~"],
  ])(
    "keeps ATX headings inside %s fences in the parent section chunk with content preserved",
    (_label, fence) => {
      const fencedBlock = `${fence}
### Fenced heading inside code
unique-token-${fence}
${fence}`;
      const body = `## Parent section

Prologue before fence.

${fencedBlock}

Epilogue after fence.`;

      const chunks = chunkOkfBody(body);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.partKey).toBe("parent-section");
      expect(chunks[0]!.sectionHeading).toBe("Parent section");
      expect(chunks[0]!.body).toContain("### Fenced heading inside code");
      expect(chunks[0]!.body).toContain(`unique-token-${fence}`);
      expect(chunks[0]!.body).toContain("Epilogue after fence.");
      expect(
        chunks.some((chunk) => chunk.partKey.includes("fenced-heading")),
      ).toBe(false);
    },
  );

  it("keeps fenced code blocks as one paragraph despite internal blank lines", () => {
    const body = `Before code.

\`\`\`
line one

line two
\`\`\`

After code.`;

    const paragraphs = splitBodyIntoParagraphs(body);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[1]).toContain("line one\n\nline two");
  });

  it("emits a single oversized fenced block once without mid-fence splits", () => {
    const inner = "x".repeat(MAX_CHUNK_ESTIMATED_TOKENS * 4);
    const body = `\`\`\`\n${inner}\n\`\`\``;
    const chunks = chunkOkfBody(body);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.body).toBe(body.trim());
  });
});

describe("retrieval unit derivation", () => {
  it("maps source_class from OKF concept namespace", () => {
    expect(sourceClassFromConceptId("portfolio/renovate-governance-case")).toBe(
      "portfolio",
    );
    expect(sourceClassFromConceptId("repo/renovate-workflow-overview")).toBe(
      "repo",
    );
    expect(
      sourceClassFromConceptId(
        "writing/evidence-driven-dependency-upgrades-article",
      ),
    ).toBe("writing");
    expect(sourceClassFromConceptId("about/summary")).toBe("about");
  });

  it("throws when an OKF concept yields zero retrieval units", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-empty-"));
    const conceptId = "about/empty-body-fixture";
    const conceptPath = path.join(tempRoot, `${conceptId}.md`);

    try {
      fs.mkdirSync(path.dirname(conceptPath), { recursive: true });
      fs.writeFileSync(
        conceptPath,
        `---
type: About Experience
title: Empty body fixture
resource: "https://michaeltruong.ai/about"
sources:
  -
    id: "about-page"
    title: About
    resource: "https://michaeltruong.ai/about"
generated:
  by: "test"
tags:
  - about
---

   
`,
        "utf8",
      );

      const parsed = readOkfConceptFile(conceptPath, conceptId);
      expect(() => deriveUnitsFromConcept(parsed)).toThrow(
        /OKF concept produced zero retrieval units.*about\/empty-body-fixture/,
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("builds deterministic unit_id and content_hash from concept content", () => {
    const concept = producePortfolioConcepts()[0];
    const rendered = renderConcept({
      ...concept,
      body: "Short cohesive body without section headings.",
    });
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-unit-"));
    const conceptPath = path.join(tempRoot, `${concept.id}.md`);

    try {
      fs.mkdirSync(path.dirname(conceptPath), { recursive: true });
      fs.writeFileSync(conceptPath, rendered, "utf8");

      const parsed = readOkfConceptFile(conceptPath, concept.id);

      const first = deriveUnitsFromConcept(parsed, "0.2");
      const second = deriveUnitsFromConcept(parsed, "0.2");

      expect(first).toHaveLength(1);
      expect(first[0]!.unit_id).toBe(`unit/${concept.id}`);
      expect(first[0]!.okf_concept_id).toBe(concept.id);
      expect(first[0]!.content_hash).toBe(second[0]!.content_hash);
      expect(first[0]!.text).toBe(
        composeRetrievalText(parsed.title, parsed.body),
      );
      expect(first[0]!.text.startsWith(`${parsed.title}\n\n`)).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("derives structure-aware units with required provenance fields", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-derive-"));

    try {
      buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-07T00:00:00.000Z",
        format: false,
      });

      const conceptPaths = listConceptFiles(tempRoot);
      const units = deriveRetrievalUnits({ corpusRoot: tempRoot });

      expect(conceptPaths).toHaveLength(EXPECTED_CONCEPT_COUNT);
      expect(units.length).toBeGreaterThan(EXPECTED_CONCEPT_COUNT);

      const conceptIds = new Set(units.map((unit) => unit.okf_concept_id));
      expect(conceptIds.size).toBe(EXPECTED_CONCEPT_COUNT);

      for (const unit of units) {
        expect(unit.okf_version).toBe("0.2");
        expect(unit.type.length).toBeGreaterThan(0);
        expect(unit.title.length).toBeGreaterThan(0);
        expect(unit.resource.length).toBeGreaterThan(0);
        expect(unit.text.length).toBeGreaterThan(0);
        expect(unit.content_hash).toHaveLength(64);
        expect(unit.sources.length).toBeGreaterThan(0);
        for (const source of unit.sources) {
          expect(source.id.length).toBeGreaterThan(0);
          expect(source.title.length).toBeGreaterThan(0);
          expect(source.resource.length).toBeGreaterThan(0);
        }
        expect(["portfolio", "repo", "writing", "about"]).toContain(
          unit.source_class,
        );

        if (unit.unit_id.includes("#")) {
          expect(unit.chunk_index).toBeTypeOf("number");
          expect(unit.chunk_count).toBeGreaterThan(1);
          expect(unit.metadata.chunk_count).toBe(unit.chunk_count);
        }
      }

      const attribution = units.find(
        (unit) =>
          unit.okf_concept_id ===
          "portfolio/experiment-measurement-b01-attribution",
      );
      expect(attribution).toBeTruthy();
      expect(attribution!.tags).toContain("attribution");
      expect(attribution!.text).toContain("Attribution");
      expect(attribution!.unit_id).toBe(
        "unit/portfolio/experiment-measurement-b01-attribution",
      );

      const articleChunks = units.filter(
        (unit) =>
          unit.okf_concept_id ===
          "writing/evidence-driven-dependency-upgrades-article",
      );
      expect(articleChunks.length).toBeGreaterThan(1);
      expect(
        articleChunks.some(
          (unit) =>
            unit.section_heading === "The review gate was right" ||
            unit.unit_id.includes("the-review-gate-was-right"),
        ),
      ).toBe(true);

      const ladderChunks = units.filter(
        (unit) =>
          unit.okf_concept_id === "repo/renovate-workflow-operator-ladder",
      );
      expect(ladderChunks.length).toBeGreaterThan(1);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("produces stable sorted output across repeated derivation", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-derive-"));

    try {
      buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-07T00:00:00.000Z",
        format: false,
      });

      const first = deriveRetrievalUnits({ corpusRoot: tempRoot });
      const second = deriveRetrievalUnits({ corpusRoot: tempRoot });

      expect(first.map((unit) => unit.unit_id)).toEqual(
        second.map((unit) => unit.unit_id),
      );
      expect(first.map((unit) => unit.content_hash)).toEqual(
        second.map((unit) => unit.content_hash),
      );
      expect(first[0]!.unit_id < first[first.length - 1]!.unit_id).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

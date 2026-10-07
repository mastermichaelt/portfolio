import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildOkfCorpus } from "@/scripts/assistant/okf/build.mjs";
import { listConceptFiles } from "@/scripts/assistant/okf/manifest.mjs";
import { renderConcept } from "@/scripts/assistant/okf/writer.mjs";
import { producePortfolioConcepts } from "@/scripts/assistant/okf/portfolio-producer.mjs";
import {
  composeRetrievalText,
  deriveRetrievalUnits,
  deriveUnitFromConcept,
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

  it("builds deterministic unit_id and content_hash from concept content", () => {
    const concept = producePortfolioConcepts()[0];
    const rendered = renderConcept(concept);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-unit-"));
    const conceptPath = path.join(tempRoot, `${concept.id}.md`);

    try {
      fs.mkdirSync(path.dirname(conceptPath), { recursive: true });
      fs.writeFileSync(conceptPath, rendered, "utf8");

      const parsed = readOkfConceptFile(conceptPath, concept.id);

      const first = deriveUnitFromConcept(parsed, "0.2");
      const second = deriveUnitFromConcept(parsed, "0.2");

      expect(first.unit_id).toBe(`unit/${concept.id}`);
      expect(first.okf_concept_id).toBe(concept.id);
      expect(first.content_hash).toBe(second.content_hash);
      expect(first.text).toBe(composeRetrievalText(parsed.title, parsed.body));
      expect(first.text.startsWith(`${parsed.title}\n\n`)).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("derives one unit per OKF concept with required provenance fields", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-derive-"));

    try {
      buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-07T00:00:00.000Z",
        format: false,
      });

      const conceptPaths = listConceptFiles(tempRoot);
      const units = deriveRetrievalUnits({ corpusRoot: tempRoot });

      expect(units).toHaveLength(EXPECTED_CONCEPT_COUNT);
      expect(units).toHaveLength(conceptPaths.length);

      for (const unit of units) {
        expect(unit.unit_id).toBe(`unit/${unit.okf_concept_id}`);
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
      }

      const attribution = units.find(
        (unit) =>
          unit.okf_concept_id ===
          "portfolio/experiment-measurement-b01-attribution",
      );
      expect(attribution).toBeTruthy();
      expect(attribution!.tags).toContain("attribution");
      expect(attribution!.text).toContain("Attribution");
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

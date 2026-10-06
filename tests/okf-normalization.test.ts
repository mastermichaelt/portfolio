import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildOkfCorpus } from "@/scripts/assistant/okf/build.mjs";
import {
  listConceptFiles,
  sha256File,
  sha256String,
} from "@/scripts/assistant/okf/manifest.mjs";
import { produceDevConcepts } from "@/scripts/assistant/okf/dev-producer.mjs";
import { producePortfolioConcepts } from "@/scripts/assistant/okf/portfolio-producer.mjs";
import { produceRepoConcepts } from "@/scripts/assistant/okf/repo-producer.mjs";
import { renderConcept } from "@/scripts/assistant/okf/writer.mjs";
import { splitFrontmatter } from "@/scripts/assistant/okf/yaml.mjs";

const CORPUS_ROOT = path.join(process.cwd(), "assistant-corpus");
const FIXTURES_ROOT = path.join(CORPUS_ROOT, "fixtures");

function readConcept(relativePath: string) {
  const absolutePath = path.join(CORPUS_ROOT, relativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  return { raw, frontmatter, body };
}

function parseFrontmatterType(frontmatterYaml: string | null): string {
  expect(frontmatterYaml).toBeTruthy();
  const match = frontmatterYaml!.match(/^type:\s*(.+)$/m);
  expect(match).toBeTruthy();
  return match![1].replace(/^["']|["']$/g, "");
}

describe("OKF producers", () => {
  it("keeps portfolio, repo, and dev producer boundaries separate", () => {
    const portfolio = producePortfolioConcepts();
    const repo = produceRepoConcepts(FIXTURES_ROOT);
    const dev = produceDevConcepts(FIXTURES_ROOT);

    expect(portfolio.length).toBeGreaterThanOrEqual(7);
    expect(repo.length).toBeGreaterThanOrEqual(5);
    expect(dev).toHaveLength(2);
    expect(
      portfolio.every((concept) => concept.id.startsWith("portfolio/")),
    ).toBe(true);
    expect(repo.every((concept) => concept.id.startsWith("repo/"))).toBe(true);
    expect(dev.every((concept) => concept.id.startsWith("writing/"))).toBe(
      true,
    );
  });

  it("renders concepts with non-empty type frontmatter", () => {
    const concepts = [
      ...producePortfolioConcepts(),
      ...produceRepoConcepts(FIXTURES_ROOT),
      ...produceDevConcepts(FIXTURES_ROOT),
    ];

    for (const concept of concepts) {
      const rendered = renderConcept(concept);
      const { frontmatter } = splitFrontmatter(rendered);
      const type = parseFrontmatterType(frontmatter);
      expect(type.length).toBeGreaterThan(0);
      expect(rendered).toContain("sources:");
      expect(rendered).toContain("resource:");
      expect(rendered).toContain("generated:");
    }
  });
});

describe("committed OKF corpus", () => {
  it("includes index, manifest, inspection report, and fixtures manifest", () => {
    expect(fs.existsSync(path.join(CORPUS_ROOT, "index.md"))).toBe(true);
    expect(fs.existsSync(path.join(CORPUS_ROOT, "manifest.json"))).toBe(true);
    expect(fs.existsSync(path.join(CORPUS_ROOT, "INSPECTION.md"))).toBe(true);
    expect(fs.existsSync(path.join(FIXTURES_ROOT, "manifest.json"))).toBe(true);
  });

  it("conforms every committed concept document", () => {
    const conceptPaths = listConceptFiles(CORPUS_ROOT);
    expect(conceptPaths.length).toBeGreaterThanOrEqual(15);

    for (const relativePath of conceptPaths) {
      const { frontmatter, body } = readConcept(relativePath);
      const type = parseFrontmatterType(frontmatter);
      expect(type.length).toBeGreaterThan(0);
      expect(body.trim().length).toBeGreaterThan(0);
      expect(frontmatter).toContain("sources:");
      expect(frontmatter).toContain("resource:");
    }
  });

  it("records stable concept ids and fixture hashes in manifests", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(CORPUS_ROOT, "manifest.json"), "utf8"),
    );
    const fixtureManifest = JSON.parse(
      fs.readFileSync(path.join(FIXTURES_ROOT, "manifest.json"), "utf8"),
    );

    const expectedConceptIds = listConceptFiles(CORPUS_ROOT).map((entry) =>
      entry.replace(/\.md$/, ""),
    );
    const manifestIds = manifest.outputs.concepts.map(
      (entry: { path: string }) => entry.path.replace(/\.md$/, ""),
    );

    expect(manifestIds).toEqual(expectedConceptIds);
    expect(manifest.outputs.concept_count).toBe(expectedConceptIds.length);
    expect(manifest.inputs.fixtures).toEqual(fixtureManifest.fixtures);

    for (const [fixtureName, fixture] of Object.entries(
      fixtureManifest.fixtures,
    ) as Array<[string, { sha256: string }]>) {
      const fixturePath = path.join(FIXTURES_ROOT, fixtureName);
      expect(sha256File(fixturePath)).toBe(fixture.sha256);
    }
  });

  it("builds deterministically from pinned inputs", () => {
    const first = buildOkfCorpus({
      corpusRoot: CORPUS_ROOT,
      generatedAt: "2026-10-06T00:00:00.000Z",
    });
    const second = buildOkfCorpus({
      corpusRoot: CORPUS_ROOT,
      generatedAt: "2026-10-06T00:00:00.000Z",
    });

    expect(first.manifest.outputs.bundle_sha256).toBe(
      second.manifest.outputs.bundle_sha256,
    );
    expect(first.conceptCount).toBe(second.conceptCount);
  });

  it("index declares okf_version 0.2", () => {
    const index = fs.readFileSync(path.join(CORPUS_ROOT, "index.md"), "utf8");
    expect(index).toContain('okf_version: "0.2"');
  });
});

describe("OKF manifest hashing", () => {
  it("hashes concept outputs consistently", () => {
    const relativePath = listConceptFiles(CORPUS_ROOT)[0];
    const content = fs.readFileSync(
      path.join(CORPUS_ROOT, relativePath),
      "utf8",
    );
    expect(sha256String(content)).toHaveLength(64);
  });
});

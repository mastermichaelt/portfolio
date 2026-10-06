import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildOkfCorpus } from "@/scripts/assistant/okf/build.mjs";
import {
  CORPUS_ROOT,
  FIXTURES_DIR,
} from "@/scripts/assistant/okf/constants.mjs";
import {
  buildFixtureInputs,
  listConceptFiles,
  sha256String,
} from "@/scripts/assistant/okf/manifest.mjs";
import { produceDevConcepts } from "@/scripts/assistant/okf/dev-producer.mjs";
import { producePortfolioConcepts } from "@/scripts/assistant/okf/portfolio-producer.mjs";
import { produceRepoConcepts } from "@/scripts/assistant/okf/repo-producer.mjs";
import { renderConcept } from "@/scripts/assistant/okf/writer.mjs";
import { splitFrontmatter } from "@/scripts/assistant/okf/yaml.mjs";

const FIXTURES_ROOT = path.join(process.cwd(), FIXTURES_DIR);

function parseFrontmatterType(frontmatterYaml: string | null): string {
  expect(frontmatterYaml).toBeTruthy();
  const match = frontmatterYaml!.match(/^type:\s*(.+)$/m);
  expect(match).toBeTruthy();
  return match![1].replace(/^["']|["']$/g, "");
}

function readConcept(corpusRoot: string, relativePath: string) {
  const absolutePath = path.join(corpusRoot, relativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  return { raw, frontmatter, body };
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

describe("OKF normalization build", () => {
  it("records representative fixture inputs with stable hashes", () => {
    const fixtures = buildFixtureInputs(FIXTURES_ROOT);
    expect(Object.keys(fixtures)).toEqual([
      "renovate-workflow.md",
      "evidence-driven-dependency-upgrades.md",
    ]);
    for (const fixture of Object.values(fixtures)) {
      expect(fixture.sha256).toHaveLength(64);
      expect(fs.existsSync(path.join(process.cwd(), fixture.path))).toBe(true);
    }
  });

  it("builds a conformant ephemeral bundle deterministically", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-corpus-"));

    try {
      const first = buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-06T00:00:00.000Z",
        format: false,
      });
      const second = buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-06T00:00:00.000Z",
        format: false,
      });

      expect(first.manifest.outputs.bundle_sha256).toBe(
        second.manifest.outputs.bundle_sha256,
      );
      expect(first.conceptCount).toBeGreaterThanOrEqual(15);
      expect(first.conceptCount).toBe(second.conceptCount);

      const conceptPaths = listConceptFiles(tempRoot);
      expect(conceptPaths.length).toBe(first.conceptCount);

      for (const relativePath of conceptPaths) {
        const { frontmatter, body } = readConcept(tempRoot, relativePath);
        const type = parseFrontmatterType(frontmatter);
        expect(type.length).toBeGreaterThan(0);
        expect(body.trim().length).toBeGreaterThan(0);
        expect(frontmatter).toContain("sources:");
        expect(frontmatter).toContain("resource:");
      }

      const index = fs.readFileSync(path.join(tempRoot, "index.md"), "utf8");
      expect(index).toContain('okf_version: "0.2"');
      expect(first.manifest.inputs.fixtures).toEqual(
        buildFixtureInputs(FIXTURES_ROOT),
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("targets the gitignored generated output root by default", () => {
    expect(CORPUS_ROOT).toBe("generated/okf");
    const gitignore = fs.readFileSync(
      path.join(process.cwd(), ".gitignore"),
      "utf8",
    );
    expect(gitignore).toContain("/generated/");
  });

  it("writes inspectable output under the default corpus root", () => {
    const outputRoot = path.join(process.cwd(), CORPUS_ROOT);
    fs.rmSync(outputRoot, { recursive: true, force: true });

    const result = buildOkfCorpus({ format: false });
    expect(result.conceptCount).toBe(15);
    expect(fs.existsSync(path.join(outputRoot, "index.md"))).toBe(true);
    expect(fs.existsSync(path.join(outputRoot, "manifest.json"))).toBe(true);
    expect(listConceptFiles(outputRoot).length).toBe(15);
  });
});

describe("OKF manifest hashing", () => {
  it("hashes concept outputs consistently", () => {
    const concept = producePortfolioConcepts()[0];
    const rendered = renderConcept(concept);
    expect(sha256String(rendered)).toHaveLength(64);
  });
});

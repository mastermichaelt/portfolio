import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { produceAboutConcepts } from "@/scripts/assistant/okf/about-producer.mjs";
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
import { produceEcosystemConcepts } from "@/scripts/assistant/okf/ecosystem-producer.mjs";
import { producePortfolioConcepts } from "@/scripts/assistant/okf/portfolio-producer.mjs";
import {
  caseBlockBody,
  produceProjectCaseConcepts,
} from "@/scripts/assistant/okf/project-case-producer.mjs";
import { produceCareerInventoryConcepts } from "@/scripts/assistant/okf/career-inventory-producer.mjs";
import { produceRepoConcepts } from "@/scripts/assistant/okf/repo-producer.mjs";
import { renderConcept } from "@/scripts/assistant/okf/writer.mjs";
import { splitFrontmatter } from "@/scripts/assistant/okf/yaml.mjs";
import { projectCases } from "@/content/project-cases";

const FIXTURES_ROOT = path.join(process.cwd(), FIXTURES_DIR);
const EXPECTED_CONCEPT_COUNT = 94;

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
  it("keeps portfolio, repo, dev, about, and project-case producer boundaries separate", () => {
    const portfolio = producePortfolioConcepts();
    const projectCase = produceProjectCaseConcepts();
    const ecosystem = produceEcosystemConcepts();
    const about = produceAboutConcepts();
    const repo = produceRepoConcepts(FIXTURES_ROOT);
    const dev = produceDevConcepts();
    const career = produceCareerInventoryConcepts();

    expect(portfolio).toHaveLength(30);
    expect(projectCase).toHaveLength(11);
    expect(ecosystem).toHaveLength(4);
    expect(about).toHaveLength(9);
    expect(repo.length).toBeGreaterThanOrEqual(5);
    expect(dev).toHaveLength(30);
    expect(career).toHaveLength(5);

    expect(
      portfolio.every((concept) => concept.id.startsWith("portfolio/")),
    ).toBe(true);
    expect(
      projectCase.every((concept) => concept.id.startsWith("portfolio/")),
    ).toBe(true);
    expect(
      ecosystem.every((concept) =>
        concept.id.startsWith("portfolio/ecosystem-"),
      ),
    ).toBe(true);
    expect(about.every((concept) => concept.id.startsWith("about/"))).toBe(
      true,
    );
    expect(repo.every((concept) => concept.id.startsWith("repo/"))).toBe(true);
    expect(dev.every((concept) => concept.id.startsWith("writing/"))).toBe(
      true,
    );
    expect(career.every((concept) => concept.id.startsWith("career/"))).toBe(
      true,
    );

    expect(
      projectCase.filter((concept) =>
        concept.id.startsWith("portfolio/experiment-measurement-"),
      ),
    ).toHaveLength(6);
    expect(
      projectCase.filter((concept) =>
        concept.id.startsWith("portfolio/codenames-ai-"),
      ),
    ).toHaveLength(5);
  });

  it("preserves CaseBlock heading, body, and contract in project-case bodies", () => {
    const attributionBlock = projectCases
      .find((entry) => entry.slug === "experiment-measurement")
      ?.blocks.find((block) => block.id === "b01");
    expect(attributionBlock).toBeTruthy();

    const body = caseBlockBody(attributionBlock!);
    expect(body).toContain(attributionBlock!.heading);
    expect(body).toContain(attributionBlock!.body[0]);
    expect(body).toContain(`Contract: ${attributionBlock!.contract}`);
  });

  it("renders concepts with non-empty type frontmatter", () => {
    const concepts = [
      ...producePortfolioConcepts(),
      ...produceProjectCaseConcepts(),
      ...produceEcosystemConcepts(),
      ...produceAboutConcepts(),
      ...produceRepoConcepts(FIXTURES_ROOT),
      ...produceDevConcepts(),
      ...produceCareerInventoryConcepts(),
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
    expect(Object.keys(fixtures)).toEqual(["renovate-workflow.md"]);
    for (const fixture of Object.values(fixtures)) {
      expect(fixture.sha256).toHaveLength(64);
      expect(fs.existsSync(path.join(process.cwd(), fixture.path))).toBe(true);
    }
  });

  it("builds a conformant ephemeral bundle deterministically across all namespaces", () => {
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
      expect(first.conceptCount).toBe(EXPECTED_CONCEPT_COUNT);
      expect(first.conceptCount).toBe(second.conceptCount);

      const conceptPaths = listConceptFiles(tempRoot);
      expect(conceptPaths.length).toBe(first.conceptCount);
      expect(conceptPaths.some((entry) => entry.startsWith("portfolio/"))).toBe(
        true,
      );
      expect(conceptPaths.some((entry) => entry.startsWith("repo/"))).toBe(
        true,
      );
      expect(conceptPaths.some((entry) => entry.startsWith("writing/"))).toBe(
        true,
      );
      expect(conceptPaths.some((entry) => entry.startsWith("about/"))).toBe(
        true,
      );
      expect(conceptPaths.some((entry) => entry.startsWith("career/"))).toBe(
        true,
      );

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
      expect(index).toContain("## About concepts");
      expect(first.manifest.inputs.fixtures).toEqual(
        buildFixtureInputs(FIXTURES_ROOT),
      );
      expect(first.manifest.inputs.about).toEqual({
        kind: "in-repo content modules",
        paths: ["content/about.ts"],
      });
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("removes stale about concepts on rebuild", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-corpus-"));

    try {
      buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-06T00:00:00.000Z",
        format: false,
      });

      const orphanPath = path.join(tempRoot, "about", "orphan-stub.md");
      fs.mkdirSync(path.dirname(orphanPath), { recursive: true });
      fs.writeFileSync(orphanPath, "# orphan\n", "utf8");
      expect(fs.existsSync(orphanPath)).toBe(true);

      buildOkfCorpus({
        corpusRoot: tempRoot,
        generatedAt: "2026-10-06T00:00:00.000Z",
        format: false,
      });

      expect(fs.existsSync(orphanPath)).toBe(false);
      expect(
        listConceptFiles(tempRoot).some(
          (entry) => entry === "about/orphan-stub.md",
        ),
      ).toBe(false);
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
    expect(result.conceptCount).toBe(EXPECTED_CONCEPT_COUNT);
    expect(fs.existsSync(path.join(outputRoot, "index.md"))).toBe(true);
    expect(fs.existsSync(path.join(outputRoot, "manifest.json"))).toBe(true);
    expect(listConceptFiles(outputRoot).length).toBe(EXPECTED_CONCEPT_COUNT);

    const attributionConcept = readConcept(
      outputRoot,
      "portfolio/experiment-measurement-b01-attribution.md",
    );
    const attributionBlock = projectCases
      .find((entry) => entry.slug === "experiment-measurement")
      ?.blocks.find((block) => block.id === "b01");
    expect(attributionConcept.body).toContain(attributionBlock!.heading);
  });
});

describe("OKF manifest hashing", () => {
  it("hashes concept outputs consistently", () => {
    const concept = producePortfolioConcepts()[0];
    const rendered = renderConcept(concept);
    expect(sha256String(rendered)).toHaveLength(64);
  });
});

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertCareerInventoryPublicationIntegrity,
  assertSafeCareerInventoryRelativePath,
  CAREER_INVENTORY_DIR,
  CAREER_PUBLICATION_MANIFEST_PATH,
  CAREER_SOURCE_ELIGIBILITY_PATH,
  loadPublicationManifest,
} from "@/scripts/assistant/okf/career-inventory-manifest.mjs";
import { produceCareerInventoryConcepts } from "@/scripts/assistant/okf/career-inventory-producer.mjs";
import { sha256File } from "@/scripts/assistant/okf/manifest.mjs";
import { sourceClassFromConceptId } from "@/scripts/assistant/retrieval/derive-units.mjs";

describe("career inventory publication boundary", () => {
  it("pins source eligibility and publication manifests on disk", () => {
    expect(fs.existsSync(CAREER_SOURCE_ELIGIBILITY_PATH)).toBe(true);
    expect(fs.existsSync(CAREER_PUBLICATION_MANIFEST_PATH)).toBe(true);
    const manifest = loadPublicationManifest();
    expect(manifest.snapshots.length).toBe(5);
    for (const entry of manifest.snapshots) {
      const absolutePath = path.join(CAREER_INVENTORY_DIR, entry.file);
      expect(fs.existsSync(absolutePath)).toBe(true);
      expect(sha256File(absolutePath)).toBe(entry.sha256);
    }
  });

  it("fails closed when publication integrity checks run", () => {
    expect(() => assertCareerInventoryPublicationIntegrity()).not.toThrow();
  });

  it("rejects unsafe and malformed career inventory paths", () => {
    expect(() =>
      assertSafeCareerInventoryRelativePath(
        "facts/admin-hub-experimentation.yml",
        "eligible_source",
      ),
    ).not.toThrow();
    expect(() =>
      assertSafeCareerInventoryRelativePath(
        "snapshots/admin-hub-experimentation.md",
        "snapshot_file",
      ),
    ).not.toThrow();

    for (const unsafe of [
      "../facts/leak.yml",
      "facts/../../etc/passwd",
      "/etc/passwd",
      "snapshots/../publication-manifest.json",
      "wrong/admin-hub.yml",
    ]) {
      expect(() =>
        assertSafeCareerInventoryRelativePath(unsafe, "eligible_source"),
      ).toThrow();
    }
    expect(() =>
      assertSafeCareerInventoryRelativePath(
        "snapshots/../source-eligibility.json",
        "snapshot_file",
      ),
    ).toThrow();
  });

  it("emits career/ concepts from snapshots only with source_class career", () => {
    const concepts = produceCareerInventoryConcepts();
    expect(concepts).toHaveLength(5);
    for (const concept of concepts) {
      expect(concept.id.startsWith("career/")).toBe(true);
      expect(sourceClassFromConceptId(concept.id)).toBe("career");
      expect(concept.frontmatter.resource).toBe(
        "https://michaeltruong.ai/about",
      );
      expect(concept.body.length).toBeGreaterThan(0);
      const resource = String(concept.frontmatter.resource);
      expect(resource).not.toContain("resumes");
      expect(concept.body).not.toMatch(/applications\//);
    }
    expect(concepts.map((c) => c.id).sort()).toEqual(
      [
        "career/admin-hub-experimentation",
        "career/cross-flow-experiment-measurement",
        "career/em-growth-delivery",
        "career/loom-acquisition",
        "career/savepoints-durable-capture",
      ].sort(),
    );
  });
});

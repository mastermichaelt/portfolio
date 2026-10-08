import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertMarketplacePublicationIntegrity,
  assertSafeMarketplaceSnapshotPath,
  loadMarketplacePublicationManifest,
  MARKETPLACE_PUBLIC_DOCS_DIR,
  MARKETPLACE_PUBLICATION_MANIFEST_PATH,
} from "@/scripts/assistant/okf/marketplace-public-docs-manifest.mjs";
import { produceMarketplacePublicDocsConcepts } from "@/scripts/assistant/okf/marketplace-public-docs-producer.mjs";
import { marketplaceUpstreamResource } from "@/scripts/assistant/okf/constants.mjs";
import { sha256File } from "@/scripts/assistant/okf/manifest.mjs";
import { sourceClassFromConceptId } from "@/scripts/assistant/retrieval/derive-units.mjs";

describe("marketplace public docs publication boundary", () => {
  it("pins publication manifest and snapshot hashes on disk", () => {
    expect(fs.existsSync(MARKETPLACE_PUBLICATION_MANIFEST_PATH)).toBe(true);
    const manifest = loadMarketplacePublicationManifest();
    expect(manifest.snapshots.length).toBe(4);
    for (const entry of manifest.snapshots) {
      const absolutePath = path.join(MARKETPLACE_PUBLIC_DOCS_DIR, entry.file);
      expect(fs.existsSync(absolutePath)).toBe(true);
      expect(sha256File(absolutePath)).toBe(entry.sha256);
    }
  });

  it("fails closed when publication integrity checks run", () => {
    expect(() => assertMarketplacePublicationIntegrity()).not.toThrow();
  });

  it("rejects unsafe marketplace snapshot paths", () => {
    expect(() =>
      assertSafeMarketplaceSnapshotPath(
        "snapshots/cursor-team-marketplace-readme.md",
      ),
    ).not.toThrow();

    for (const unsafe of [
      "../README.md",
      "snapshots/../../publication-manifest.json",
      "/etc/passwd",
      "wrong/readme.md",
    ]) {
      expect(() => assertSafeMarketplaceSnapshotPath(unsafe)).toThrow();
    }
  });

  it("emits tooling/ concepts from snapshots only with source_class tooling", () => {
    const concepts = produceMarketplacePublicDocsConcepts();
    expect(concepts).toHaveLength(4);
    for (const concept of concepts) {
      expect(concept.id.startsWith("tooling/")).toBe(true);
      expect(sourceClassFromConceptId(concept.id)).toBe("tooling");
      expect(concept.body.length).toBeGreaterThan(0);
      expect(concept.body).not.toMatch(/SKILL\.md/);
      const upstream = concept.frontmatter.upstream as {
        path: string;
      };
      expect(concept.frontmatter.resource).toBe(
        marketplaceUpstreamResource(upstream.path),
      );
    }
    expect(concepts.map((c) => c.id).sort()).toEqual(
      [
        "tooling/cursor-team-marketplace-overview",
        "tooling/engineering-invariants",
        "tooling/team-harness-layers",
        "tooling/team-harness-versioning",
      ].sort(),
    );
  });
});

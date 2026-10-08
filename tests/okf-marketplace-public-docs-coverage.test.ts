import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertMarketplacePublicationIntegrity,
  assertSafeMarketplaceSnapshotPath,
  loadMarketplacePublicationManifest,
  MARKETPLACE_PUBLIC_DOCS_DIR,
  MARKETPLACE_PUBLICATION_MANIFEST_PATH,
  MARKETPLACE_SNAPSHOTS_DIR,
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

  it("rejects orphan snapshot markdown without publication approval", () => {
    const orphanPath = path.join(
      MARKETPLACE_SNAPSHOTS_DIR,
      "orphan-unapproved.md",
    );
    fs.writeFileSync(orphanPath, "# Orphan fixture\n", "utf8");
    try {
      expect(() => assertMarketplacePublicationIntegrity()).toThrow(
        /Orphan marketplace snapshot without publication approval: snapshots\/orphan-unapproved\.md/,
      );
      expect(() => produceMarketplacePublicDocsConcepts()).toThrow(
        /Orphan marketplace snapshot without publication approval/,
      );
    } finally {
      fs.unlinkSync(orphanPath);
    }
  });

  it("rejects manifest entries for snapshots not on the allowlist", () => {
    const manifestBackup = fs.readFileSync(
      MARKETPLACE_PUBLICATION_MANIFEST_PATH,
      "utf8",
    );
    const manifest = loadMarketplacePublicationManifest();
    const tampered = {
      ...manifest,
      snapshots: [
        ...manifest.snapshots,
        {
          file: "snapshots/not-on-allowlist.md",
          concept_slug: "not-on-allowlist",
          upstream_path:
            "plugins/team-harness/skills/planning-methodology/SKILL.md",
          sha256: "0".repeat(64),
        },
      ],
    };
    fs.writeFileSync(
      MARKETPLACE_PUBLICATION_MANIFEST_PATH,
      `${JSON.stringify(tampered, null, 2)}\n`,
    );
    try {
      expect(() => assertMarketplacePublicationIntegrity()).toThrow();
      expect(() => produceMarketplacePublicDocsConcepts()).toThrow();
    } finally {
      fs.writeFileSync(MARKETPLACE_PUBLICATION_MANIFEST_PATH, manifestBackup);
    }
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

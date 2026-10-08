import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { savepointsUpstreamResource } from "@/scripts/assistant/okf/constants.mjs";
import { sha256File } from "@/scripts/assistant/okf/manifest.mjs";
import {
  assertSafeSavepointsSnapshotPath,
  assertSavepointsPublicationIntegrity,
  loadSavepointsPublicationManifest,
  SAVEPOINTS_PUBLIC_NOTES_DIR,
  SAVEPOINTS_PUBLICATION_MANIFEST_PATH,
  SAVEPOINTS_SNAPSHOTS_DIR,
} from "@/scripts/assistant/okf/savepoints-public-notes-manifest.mjs";
import { produceSavepointsPublicNotesConcepts } from "@/scripts/assistant/okf/savepoints-public-notes-producer.mjs";
import { sourceClassFromConceptId } from "@/scripts/assistant/retrieval/derive-units.mjs";

describe("savepoints public notes publication boundary", () => {
  it("pins publication manifest and snapshot hashes on disk", () => {
    expect(fs.existsSync(SAVEPOINTS_PUBLICATION_MANIFEST_PATH)).toBe(true);
    const manifest = loadSavepointsPublicationManifest();
    expect(manifest.snapshots.length).toBe(1);
    for (const entry of manifest.snapshots) {
      const absolutePath = path.join(SAVEPOINTS_PUBLIC_NOTES_DIR, entry.file);
      expect(fs.existsSync(absolutePath)).toBe(true);
      expect(sha256File(absolutePath)).toBe(entry.sha256);
    }
  });

  it("fails closed when publication integrity checks run", () => {
    expect(() => assertSavepointsPublicationIntegrity()).not.toThrow();
  });

  it("rejects orphan snapshot markdown without publication approval", () => {
    const orphanPath = path.join(
      SAVEPOINTS_SNAPSHOTS_DIR,
      "orphan-unapproved.md",
    );
    fs.writeFileSync(orphanPath, "# Orphan fixture\n", "utf8");
    try {
      expect(() => assertSavepointsPublicationIntegrity()).toThrow(
        /Orphan savepoints snapshot without publication approval: snapshots\/orphan-unapproved\.md/,
      );
      expect(() => produceSavepointsPublicNotesConcepts()).toThrow(
        /Orphan savepoints snapshot without publication approval/,
      );
    } finally {
      fs.unlinkSync(orphanPath);
    }
  });

  it("rejects manifest entries for snapshots not on the allowlist", () => {
    const manifestBackup = fs.readFileSync(
      SAVEPOINTS_PUBLICATION_MANIFEST_PATH,
      "utf8",
    );
    const manifest = loadSavepointsPublicationManifest();
    const tampered = {
      ...manifest,
      snapshots: [
        ...manifest.snapshots,
        {
          file: "snapshots/not-on-allowlist.md",
          concept_slug: "not-on-allowlist",
          upstream_path: "notes/savepoints-6-pager.md",
          sha256: "0".repeat(64),
        },
      ],
    };
    fs.writeFileSync(
      SAVEPOINTS_PUBLICATION_MANIFEST_PATH,
      `${JSON.stringify(tampered, null, 2)}\n`,
    );
    try {
      expect(() => assertSavepointsPublicationIntegrity()).toThrow();
      expect(() => produceSavepointsPublicNotesConcepts()).toThrow();
    } finally {
      fs.writeFileSync(SAVEPOINTS_PUBLICATION_MANIFEST_PATH, manifestBackup);
    }
  });

  it("rejects unsafe savepoints snapshot paths", () => {
    expect(() =>
      assertSafeSavepointsSnapshotPath(
        "snapshots/savepoints-architecture-direction-excerpt.md",
      ),
    ).not.toThrow();

    for (const unsafe of [
      "../README.md",
      "snapshots/../../publication-manifest.json",
      "/etc/passwd",
      "wrong/readme.md",
    ]) {
      expect(() => assertSafeSavepointsSnapshotPath(unsafe)).toThrow();
    }
  });

  it("emits tooling/ concepts from snapshots only with source_class tooling", () => {
    const concepts = produceSavepointsPublicNotesConcepts();
    expect(concepts).toHaveLength(1);
    for (const concept of concepts) {
      expect(concept.id.startsWith("tooling/")).toBe(true);
      expect(sourceClassFromConceptId(concept.id)).toBe("tooling");
      expect(concept.body.length).toBeGreaterThan(0);
      expect(concept.body).toContain("capture review");
      expect(concept.body).not.toContain(".cursor/plans");
      const upstream = concept.frontmatter.upstream as {
        path: string;
        publication_kind: string;
      };
      expect(concept.frontmatter.resource).toBe(
        savepointsUpstreamResource(upstream.path),
      );
      expect(upstream.publication_kind).toBe("reviewed-excerpt");
    }
    expect(concepts.map((c) => c.id)).toEqual([
      "tooling/savepoints-architecture-direction",
    ]);
  });
});

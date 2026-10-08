import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CODENAMES_REPO,
  codenamesUpstreamResource,
} from "@/scripts/assistant/okf/constants.mjs";
import { sha256File } from "@/scripts/assistant/okf/manifest.mjs";
import {
  assertCodenamesPublicationIntegrity,
  assertSafeCodenamesSourcePath,
  CODENAMES_ENGINEERING_DOCS_DIR,
  CODENAMES_PUBLICATION_MANIFEST_PATH,
  CODENAMES_SOURCES_DIR,
  loadCodenamesPublicationManifest,
} from "@/scripts/assistant/okf/codenames-engineering-docs-manifest.mjs";
import { produceCodenamesEngineeringDocsConcepts } from "@/scripts/assistant/okf/codenames-engineering-docs-producer.mjs";
import { sourceClassFromConceptId } from "@/scripts/assistant/retrieval/derive-units.mjs";

describe("codenames engineering docs publication boundary", () => {
  it("pins publication manifest and source hashes on disk", () => {
    expect(fs.existsSync(CODENAMES_PUBLICATION_MANIFEST_PATH)).toBe(true);
    const manifest = loadCodenamesPublicationManifest();
    expect(manifest.sources.length).toBe(2);
    for (const entry of manifest.sources) {
      const absolutePath = path.join(
        CODENAMES_ENGINEERING_DOCS_DIR,
        entry.file,
      );
      expect(fs.existsSync(absolutePath)).toBe(true);
      expect(sha256File(absolutePath)).toBe(entry.sha256);
    }
  });

  it("fails closed when publication integrity checks run", () => {
    expect(() => assertCodenamesPublicationIntegrity()).not.toThrow();
  });

  it("rejects manifest upstream_repo that does not match CODENAMES_REPO", () => {
    const manifestBackup = fs.readFileSync(
      CODENAMES_PUBLICATION_MANIFEST_PATH,
      "utf8",
    );
    const manifest = loadCodenamesPublicationManifest();
    const tampered = {
      ...manifest,
      upstream_repo: "multipliers-dev/wrong-repo",
    };
    fs.writeFileSync(
      CODENAMES_PUBLICATION_MANIFEST_PATH,
      `${JSON.stringify(tampered, null, 2)}\n`,
    );
    try {
      expect(() => assertCodenamesPublicationIntegrity()).toThrow(
        new RegExp(
          `Codenames manifest upstream_repo must match CODENAMES_REPO \\(${CODENAMES_REPO}\\)`,
        ),
      );
      expect(() => produceCodenamesEngineeringDocsConcepts()).toThrow(
        /must match CODENAMES_REPO/,
      );
    } finally {
      fs.writeFileSync(CODENAMES_PUBLICATION_MANIFEST_PATH, manifestBackup);
    }
  });

  it("throws when validation-flow pinned source omits the section end delimiter", () => {
    const validationSourcePath = path.join(
      CODENAMES_SOURCES_DIR,
      "judge-ai-validation-flow.md",
    );
    const manifestBackup = fs.readFileSync(
      CODENAMES_PUBLICATION_MANIFEST_PATH,
      "utf8",
    );
    const sourceBackup = fs.readFileSync(validationSourcePath, "utf8");

    const tampered = sourceBackup.replace(
      "\n---\n\n## Related mode: STRANGE\n",
      "\n---\n\n## Continued notes\n",
    );
    fs.writeFileSync(validationSourcePath, tampered, "utf8");

    const manifest = loadCodenamesPublicationManifest();
    const updated = {
      ...manifest,
      sources: manifest.sources.map(
        (entry: { file: string; upstream_path: string; sha256: string }) =>
          entry.file === "sources/judge-ai-validation-flow.md"
            ? { ...entry, sha256: sha256File(validationSourcePath) }
            : entry,
      ),
    };
    fs.writeFileSync(
      CODENAMES_PUBLICATION_MANIFEST_PATH,
      `${JSON.stringify(updated, null, 2)}\n`,
    );

    try {
      expect(() => assertCodenamesPublicationIntegrity()).not.toThrow();
      expect(() => produceCodenamesEngineeringDocsConcepts()).toThrow(
        /End section not found:[\s\S]*Related mode: STRANGE/,
      );
    } finally {
      fs.writeFileSync(validationSourcePath, sourceBackup, "utf8");
      fs.writeFileSync(CODENAMES_PUBLICATION_MANIFEST_PATH, manifestBackup);
    }
  });

  it("rejects orphan source markdown without publication approval", () => {
    const orphanPath = path.join(CODENAMES_SOURCES_DIR, "orphan-unapproved.md");
    fs.writeFileSync(orphanPath, "# Orphan fixture\n", "utf8");
    try {
      expect(() => assertCodenamesPublicationIntegrity()).toThrow(
        /Orphan codenames source without publication approval: sources\/orphan-unapproved\.md/,
      );
      expect(() => produceCodenamesEngineeringDocsConcepts()).toThrow(
        /Orphan codenames source without publication approval/,
      );
    } finally {
      fs.unlinkSync(orphanPath);
    }
  });

  it("rejects manifest entries for sources not on the allowlist", () => {
    const manifestBackup = fs.readFileSync(
      CODENAMES_PUBLICATION_MANIFEST_PATH,
      "utf8",
    );
    const manifest = loadCodenamesPublicationManifest();
    const tampered = {
      ...manifest,
      sources: [
        ...manifest.sources,
        {
          file: "sources/not-on-allowlist.md",
          upstream_path: "docs/analytics-workflow.md",
          sha256: "0".repeat(64),
        },
      ],
    };
    fs.writeFileSync(
      CODENAMES_PUBLICATION_MANIFEST_PATH,
      `${JSON.stringify(tampered, null, 2)}\n`,
    );
    try {
      expect(() => assertCodenamesPublicationIntegrity()).toThrow();
      expect(() => produceCodenamesEngineeringDocsConcepts()).toThrow();
    } finally {
      fs.writeFileSync(CODENAMES_PUBLICATION_MANIFEST_PATH, manifestBackup);
    }
  });

  it("rejects unsafe codenames source paths", () => {
    expect(() =>
      assertSafeCodenamesSourcePath("sources/ai-pipeline-outcome.md"),
    ).not.toThrow();

    for (const unsafe of [
      "../README.md",
      "sources/../../publication-manifest.json",
      "/etc/passwd",
      "wrong/ai-pipeline-outcome.md",
    ]) {
      expect(() => assertSafeCodenamesSourcePath(unsafe)).toThrow();
    }
  });

  it("emits repo/ concepts from pinned sources with bounded validation sections", () => {
    const concepts = produceCodenamesEngineeringDocsConcepts();
    expect(concepts).toHaveLength(2);
    for (const concept of concepts) {
      expect(concept.id.startsWith("repo/")).toBe(true);
      expect(sourceClassFromConceptId(concept.id)).toBe("repo");
      expect(concept.body.length).toBeGreaterThan(0);
      const upstream = concept.frontmatter.upstream as { path: string };
      expect(concept.frontmatter.resource).toBe(
        codenamesUpstreamResource(upstream.path),
      );
    }

    const validation = concepts.find(
      (c) => c.id === "repo/codenames-ai-validation-flow",
    );
    expect(validation).toBeTruthy();
    expect(validation!.body).toContain("deterministic validation");
    expect(validation!.body).toContain("## Validation layers");
    expect(validation!.body).toContain("## Response shape");
    expect(validation!.body).not.toContain("```mermaid");
    expect(validation!.body).not.toContain("## Related mode: STRANGE");

    const pipeline = concepts.find(
      (c) => c.id === "repo/codenames-ai-pipeline-outcome",
    );
    expect(pipeline).toBeTruthy();
    expect(pipeline!.body).toContain("reject_classes");

    expect(concepts.map((c) => c.id)).toEqual([
      "repo/codenames-ai-pipeline-outcome",
      "repo/codenames-ai-validation-flow",
    ]);
  });
});

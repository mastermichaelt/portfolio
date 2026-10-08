import fs from "node:fs";
import path from "node:path";

import { FIXTURES_DIR } from "./constants.mjs";
import { sha256File } from "./manifest.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

export const SAVEPOINTS_PUBLIC_NOTES_DIR = path.join(
  FIXTURES_DIR,
  "savepoints-public-notes",
);

export const SAVEPOINTS_PUBLICATION_MANIFEST_PATH = path.join(
  SAVEPOINTS_PUBLIC_NOTES_DIR,
  "publication-manifest.json",
);

export const SAVEPOINTS_SNAPSHOTS_DIR = path.join(
  SAVEPOINTS_PUBLIC_NOTES_DIR,
  "snapshots",
);

const SNAPSHOT_MANIFEST_PATH = /^snapshots\/[a-z0-9][a-z0-9-]*\.md$/;
const CONCEPT_SLUG = /^[a-z0-9][a-z0-9-]*$/;
const UPSTREAM_PATH = /^[A-Za-z0-9_./-]+\.md$/;

/**
 * @param {string} relativePath
 */
export function assertSafeSavepointsSnapshotPath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new Error("Savepoints snapshot path must be a non-empty string");
  }
  if (
    relativePath.includes("..") ||
    relativePath.includes("\\") ||
    relativePath.startsWith("/")
  ) {
    throw new Error(`Unsafe savepoints snapshot path: ${relativePath}`);
  }
  if (!SNAPSHOT_MANIFEST_PATH.test(relativePath)) {
    throw new Error(
      `Malformed savepoints snapshot path (expected snapshots/*.md): ${relativePath}`,
    );
  }
  const resolved = path.resolve(SAVEPOINTS_PUBLIC_NOTES_DIR, relativePath);
  const root = path.resolve(SAVEPOINTS_PUBLIC_NOTES_DIR);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(
      `Snapshot path resolves outside savepoints-public-notes fixtures: ${relativePath}`,
    );
  }
}

export function loadSavepointsPublicationManifest() {
  const raw = fs.readFileSync(SAVEPOINTS_PUBLICATION_MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

function readSnapshotFrontmatter(snapshotRelativePath) {
  const absolutePath = path.join(
    SAVEPOINTS_PUBLIC_NOTES_DIR,
    snapshotRelativePath,
  );
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Savepoints snapshot missing YAML frontmatter: ${snapshotRelativePath}`,
    );
  }
  const parsed = parseSimpleFrontmatter(frontmatter);
  return { absolutePath, parsed, body };
}

/**
 * Structural publication integrity for pinned Savepoints public excerpts.
 * Producers must call this before emitting OKF concepts.
 */
export function assertSavepointsPublicationIntegrity() {
  const manifest = loadSavepointsPublicationManifest();
  if (manifest.default !== "deny") {
    throw new Error(
      "Savepoints publication manifest must default to deny (fail closed)",
    );
  }
  if (
    typeof manifest.upstream_repo !== "string" ||
    !manifest.upstream_repo.includes("/")
  ) {
    throw new Error("Savepoints manifest upstream_repo must be owner/repo");
  }
  if (!Array.isArray(manifest.snapshots) || manifest.snapshots.length === 0) {
    throw new Error(
      "Savepoints publication manifest must list at least one snapshot",
    );
  }

  const manifestFiles = new Set();
  const conceptSlugs = new Set();

  for (const entry of manifest.snapshots) {
    assertSafeSavepointsSnapshotPath(entry.file);
    if (manifestFiles.has(entry.file)) {
      throw new Error(
        `Duplicate snapshot path in savepoints publication manifest: ${entry.file}`,
      );
    }
    manifestFiles.add(entry.file);

    if (!CONCEPT_SLUG.test(entry.concept_slug)) {
      throw new Error(`Invalid savepoints concept_slug: ${entry.concept_slug}`);
    }
    if (conceptSlugs.has(entry.concept_slug)) {
      throw new Error(
        `Duplicate savepoints concept_slug: ${entry.concept_slug}`,
      );
    }
    conceptSlugs.add(entry.concept_slug);

    if (!UPSTREAM_PATH.test(entry.upstream_path)) {
      throw new Error(
        `Invalid savepoints upstream_path: ${entry.upstream_path}`,
      );
    }
    if (entry.upstream_path.includes("..")) {
      throw new Error(
        `Unsafe savepoints upstream_path: ${entry.upstream_path}`,
      );
    }

    const { absolutePath, parsed } = readSnapshotFrontmatter(entry.file);
    const onDiskHash = sha256File(absolutePath);
    if (onDiskHash !== entry.sha256) {
      throw new Error(
        `Savepoints snapshot hash mismatch for ${entry.file} — refresh publication-manifest.json after review`,
      );
    }

    if (parsed.concept_slug !== entry.concept_slug) {
      throw new Error(
        `Savepoints snapshot concept_slug mismatch in ${entry.file}`,
      );
    }
    if (parsed.upstream_path !== entry.upstream_path) {
      throw new Error(
        `Savepoints snapshot upstream_path mismatch in ${entry.file}`,
      );
    }
    if (parsed.upstream_repo !== manifest.upstream_repo) {
      throw new Error(
        `Savepoints snapshot upstream_repo mismatch in ${entry.file}`,
      );
    }
  }

  if (fs.existsSync(SAVEPOINTS_SNAPSHOTS_DIR)) {
    for (const fileName of fs.readdirSync(SAVEPOINTS_SNAPSHOTS_DIR).sort()) {
      if (!fileName.endsWith(".md")) continue;
      const relative = `snapshots/${fileName}`;
      if (!manifestFiles.has(relative)) {
        throw new Error(
          `Orphan savepoints snapshot without publication approval: ${relative}`,
        );
      }
    }
  }
}

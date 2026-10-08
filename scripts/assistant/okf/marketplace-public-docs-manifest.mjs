import fs from "node:fs";
import path from "node:path";

import { FIXTURES_DIR } from "./constants.mjs";
import { sha256File } from "./manifest.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

export const MARKETPLACE_PUBLIC_DOCS_DIR = path.join(
  FIXTURES_DIR,
  "marketplace-public-docs",
);

export const MARKETPLACE_PUBLICATION_MANIFEST_PATH = path.join(
  MARKETPLACE_PUBLIC_DOCS_DIR,
  "publication-manifest.json",
);

export const MARKETPLACE_SNAPSHOTS_DIR = path.join(
  MARKETPLACE_PUBLIC_DOCS_DIR,
  "snapshots",
);

const SNAPSHOT_MANIFEST_PATH = /^snapshots\/[a-z0-9][a-z0-9-]*\.md$/;
const CONCEPT_SLUG = /^[a-z0-9][a-z0-9-]*$/;
const UPSTREAM_PATH = /^[A-Za-z0-9_./-]+\.md$/;

/**
 * @param {string} relativePath
 */
export function assertSafeMarketplaceSnapshotPath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new Error("Marketplace snapshot path must be a non-empty string");
  }
  if (
    relativePath.includes("..") ||
    relativePath.includes("\\") ||
    relativePath.startsWith("/")
  ) {
    throw new Error(`Unsafe marketplace snapshot path: ${relativePath}`);
  }
  if (!SNAPSHOT_MANIFEST_PATH.test(relativePath)) {
    throw new Error(
      `Malformed marketplace snapshot path (expected snapshots/*.md): ${relativePath}`,
    );
  }
  const resolved = path.resolve(MARKETPLACE_PUBLIC_DOCS_DIR, relativePath);
  const root = path.resolve(MARKETPLACE_PUBLIC_DOCS_DIR);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(
      `Snapshot path resolves outside marketplace-public-docs fixtures: ${relativePath}`,
    );
  }
}

export function loadMarketplacePublicationManifest() {
  const raw = fs.readFileSync(MARKETPLACE_PUBLICATION_MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

function readSnapshotFrontmatter(snapshotRelativePath) {
  const absolutePath = path.join(
    MARKETPLACE_PUBLIC_DOCS_DIR,
    snapshotRelativePath,
  );
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Marketplace snapshot missing YAML frontmatter: ${snapshotRelativePath}`,
    );
  }
  const parsed = parseSimpleFrontmatter(frontmatter);
  return { absolutePath, parsed, body };
}

/**
 * Structural publication integrity for pinned marketplace public docs.
 * Producers must call this before emitting OKF concepts.
 */
export function assertMarketplacePublicationIntegrity() {
  const manifest = loadMarketplacePublicationManifest();
  if (manifest.default !== "deny") {
    throw new Error(
      "Marketplace publication manifest must default to deny (fail closed)",
    );
  }
  if (
    typeof manifest.upstream_repo !== "string" ||
    !manifest.upstream_repo.includes("/")
  ) {
    throw new Error("Marketplace manifest upstream_repo must be owner/repo");
  }
  if (!Array.isArray(manifest.snapshots) || manifest.snapshots.length === 0) {
    throw new Error(
      "Marketplace publication manifest must list at least one snapshot",
    );
  }

  const manifestFiles = new Set();
  const conceptSlugs = new Set();

  for (const entry of manifest.snapshots) {
    assertSafeMarketplaceSnapshotPath(entry.file);
    if (manifestFiles.has(entry.file)) {
      throw new Error(
        `Duplicate snapshot path in marketplace publication manifest: ${entry.file}`,
      );
    }
    manifestFiles.add(entry.file);

    if (!CONCEPT_SLUG.test(entry.concept_slug)) {
      throw new Error(
        `Invalid marketplace concept_slug: ${entry.concept_slug}`,
      );
    }
    if (conceptSlugs.has(entry.concept_slug)) {
      throw new Error(
        `Duplicate marketplace concept_slug: ${entry.concept_slug}`,
      );
    }
    conceptSlugs.add(entry.concept_slug);

    if (!UPSTREAM_PATH.test(entry.upstream_path)) {
      throw new Error(
        `Invalid marketplace upstream_path: ${entry.upstream_path}`,
      );
    }
    if (entry.upstream_path.includes("..")) {
      throw new Error(
        `Unsafe marketplace upstream_path: ${entry.upstream_path}`,
      );
    }

    const { absolutePath, parsed } = readSnapshotFrontmatter(entry.file);
    const onDiskHash = sha256File(absolutePath);
    if (onDiskHash !== entry.sha256) {
      throw new Error(
        `Marketplace snapshot hash mismatch for ${entry.file} — refresh publication-manifest.json after review`,
      );
    }

    if (parsed.concept_slug !== entry.concept_slug) {
      throw new Error(
        `Marketplace snapshot concept_slug mismatch in ${entry.file}`,
      );
    }
    if (parsed.upstream_path !== entry.upstream_path) {
      throw new Error(
        `Marketplace snapshot upstream_path mismatch in ${entry.file}`,
      );
    }
    if (parsed.upstream_repo !== manifest.upstream_repo) {
      throw new Error(
        `Marketplace snapshot upstream_repo mismatch in ${entry.file}`,
      );
    }
  }

  if (fs.existsSync(MARKETPLACE_SNAPSHOTS_DIR)) {
    for (const fileName of fs.readdirSync(MARKETPLACE_SNAPSHOTS_DIR).sort()) {
      if (!fileName.endsWith(".md")) continue;
      const relative = `snapshots/${fileName}`;
      if (!manifestFiles.has(relative)) {
        throw new Error(
          `Orphan marketplace snapshot without publication approval: ${relative}`,
        );
      }
    }
  }
}

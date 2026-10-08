import fs from "node:fs";
import path from "node:path";

import { FIXTURES_DIR } from "./constants.mjs";
import { sha256File } from "./manifest.mjs";

export const CODENAMES_ENGINEERING_DOCS_DIR = path.join(
  FIXTURES_DIR,
  "codenames-engineering-docs",
);

export const CODENAMES_PUBLICATION_MANIFEST_PATH = path.join(
  CODENAMES_ENGINEERING_DOCS_DIR,
  "publication-manifest.json",
);

export const CODENAMES_SOURCES_DIR = path.join(
  CODENAMES_ENGINEERING_DOCS_DIR,
  "sources",
);

const SOURCE_MANIFEST_PATH = /^sources\/[a-z0-9][a-z0-9-]*\.md$/;
const UPSTREAM_PATH = /^docs\/[A-Za-z0-9_./-]+\.md$/;

/**
 * @param {string} relativePath
 */
export function assertSafeCodenamesSourcePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new Error("Codenames source path must be a non-empty string");
  }
  if (
    relativePath.includes("..") ||
    relativePath.includes("\\") ||
    relativePath.startsWith("/")
  ) {
    throw new Error(`Unsafe codenames source path: ${relativePath}`);
  }
  if (!SOURCE_MANIFEST_PATH.test(relativePath)) {
    throw new Error(
      `Malformed codenames source path (expected sources/*.md): ${relativePath}`,
    );
  }
  const resolved = path.resolve(CODENAMES_ENGINEERING_DOCS_DIR, relativePath);
  const root = path.resolve(CODENAMES_ENGINEERING_DOCS_DIR);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(
      `Source path resolves outside codenames-engineering-docs fixtures: ${relativePath}`,
    );
  }
}

export function loadCodenamesPublicationManifest() {
  const raw = fs.readFileSync(CODENAMES_PUBLICATION_MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * Structural publication integrity for pinned Codenames engineering docs.
 * Producers must call this before emitting OKF concepts.
 */
export function assertCodenamesPublicationIntegrity() {
  const manifest = loadCodenamesPublicationManifest();
  if (manifest.default !== "deny") {
    throw new Error(
      "Codenames publication manifest must default to deny (fail closed)",
    );
  }
  if (
    typeof manifest.upstream_repo !== "string" ||
    !manifest.upstream_repo.includes("/")
  ) {
    throw new Error("Codenames manifest upstream_repo must be owner/repo");
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new Error(
      "Codenames publication manifest must list at least one source",
    );
  }

  const manifestFiles = new Set();

  for (const entry of manifest.sources) {
    assertSafeCodenamesSourcePath(entry.file);
    if (manifestFiles.has(entry.file)) {
      throw new Error(
        `Duplicate source path in codenames publication manifest: ${entry.file}`,
      );
    }
    manifestFiles.add(entry.file);

    if (!UPSTREAM_PATH.test(entry.upstream_path)) {
      throw new Error(
        `Invalid codenames upstream_path (expected docs/*.md): ${entry.upstream_path}`,
      );
    }
    if (entry.upstream_path.includes("..")) {
      throw new Error(`Unsafe codenames upstream_path: ${entry.upstream_path}`);
    }

    const absolutePath = path.join(CODENAMES_ENGINEERING_DOCS_DIR, entry.file);
    const onDiskHash = sha256File(absolutePath);
    if (onDiskHash !== entry.sha256) {
      throw new Error(
        `Codenames source hash mismatch for ${entry.file} — refresh publication-manifest.json after review`,
      );
    }
  }

  if (fs.existsSync(CODENAMES_SOURCES_DIR)) {
    for (const fileName of fs.readdirSync(CODENAMES_SOURCES_DIR).sort()) {
      if (!fileName.endsWith(".md")) continue;
      const relative = `sources/${fileName}`;
      if (!manifestFiles.has(relative)) {
        throw new Error(
          `Orphan codenames source without publication approval: ${relative}`,
        );
      }
    }
  }
}

/**
 * @param {string} relativePath
 */
export function readPinnedCodenamesSource(relativePath) {
  assertSafeCodenamesSourcePath(relativePath);
  const absolutePath = path.join(CODENAMES_ENGINEERING_DOCS_DIR, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

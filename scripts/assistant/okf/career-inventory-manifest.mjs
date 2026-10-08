import fs from "node:fs";
import path from "node:path";

import { FIXTURES_DIR } from "./constants.mjs";
import { sha256File } from "./manifest.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

export const CAREER_INVENTORY_DIR = path.join(FIXTURES_DIR, "career-inventory");

export const CAREER_SOURCE_ELIGIBILITY_PATH = path.join(
  CAREER_INVENTORY_DIR,
  "source-eligibility.json",
);

export const CAREER_PUBLICATION_MANIFEST_PATH = path.join(
  CAREER_INVENTORY_DIR,
  "publication-manifest.json",
);

export const CAREER_SNAPSHOTS_DIR = path.join(
  CAREER_INVENTORY_DIR,
  "snapshots",
);

/** @typedef {{ version: number, default: string, facts: string[], roles: string[], meta: string[] }} SourceEligibility */
/** @typedef {{ file: string, inventory_fact_id: string, inventory_role_id: string, source_eligibility: string[], approved_entry_ids: string[], sha256: string }} PublicationSnapshotEntry */
/** @typedef {{ version: number, snapshots: PublicationSnapshotEntry[] }} PublicationManifest */

export function loadSourceEligibility() {
  const raw = fs.readFileSync(CAREER_SOURCE_ELIGIBILITY_PATH, "utf8");
  return JSON.parse(raw);
}

export function loadPublicationManifest() {
  const raw = fs.readFileSync(CAREER_PUBLICATION_MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

const ELIGIBLE_SOURCE_PATH = /^(facts|roles|meta)\/[a-z0-9][a-z0-9-]*\.yml$/;
const SNAPSHOT_MANIFEST_PATH = /^snapshots\/[a-z0-9][a-z0-9-]*\.md$/;

/**
 * Reject traversal, absolute paths, and shapes outside the career-inventory fixture tree.
 *
 * @param {string} relativePath
 * @param {"eligible_source" | "snapshot_file"} kind
 */
export function assertSafeCareerInventoryRelativePath(relativePath, kind) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new Error("Career inventory path must be a non-empty string");
  }
  if (
    relativePath.includes("..") ||
    relativePath.includes("\\") ||
    relativePath.startsWith("/")
  ) {
    throw new Error(`Unsafe career inventory path: ${relativePath}`);
  }
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Career inventory path must be relative: ${relativePath}`);
  }

  if (kind === "eligible_source") {
    if (!ELIGIBLE_SOURCE_PATH.test(relativePath)) {
      throw new Error(
        `Malformed eligible source path (expected facts|roles|meta/*.yml): ${relativePath}`,
      );
    }
    return;
  }

  if (!SNAPSHOT_MANIFEST_PATH.test(relativePath)) {
    throw new Error(
      `Malformed snapshot manifest path (expected snapshots/*.md): ${relativePath}`,
    );
  }

  const resolved = path.resolve(CAREER_INVENTORY_DIR, relativePath);
  const root = path.resolve(CAREER_INVENTORY_DIR);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(
      `Snapshot path resolves outside career-inventory fixtures: ${relativePath}`,
    );
  }
}

function assertNonEmptyUniqueStringList(values, label) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${label} entries must be non-empty strings`);
    }
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label} entry: ${value}`);
    }
    seen.add(value);
  }
}

function assertEligibilityPathList(paths, label) {
  assertNonEmptyUniqueStringList(paths, label);
  for (const entry of paths) {
    assertSafeCareerInventoryRelativePath(entry, "eligible_source");
  }
}

function eligiblePathSet(eligibility) {
  return new Set([
    ...eligibility.facts,
    ...eligibility.roles,
    ...eligibility.meta,
  ]);
}

function readSnapshotFrontmatter(snapshotRelativePath) {
  const absolutePath = path.join(CAREER_INVENTORY_DIR, snapshotRelativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Career inventory snapshot missing YAML frontmatter: ${snapshotRelativePath}`,
    );
  }
  const parsed = parseSimpleFrontmatter(frontmatter);
  return { absolutePath, parsed, body };
}

/**
 * Structural publication integrity (hashes, allowlists, path safety, approval lists).
 * Producers must call this before emitting OKF concepts.
 *
 * Does **not** prove snapshot markdown bodies contain only claims for `approved_entry_ids`
 * — that requires explicit human content publication review before merge
 * (`tests/fixtures/assistant-okf/career-inventory/README.md`).
 */
export function assertCareerInventoryPublicationIntegrity() {
  const eligibility = loadSourceEligibility();
  if (eligibility.default !== "deny") {
    throw new Error(
      "Career source eligibility must default to deny (fail closed)",
    );
  }

  assertEligibilityPathList(eligibility.facts, "source eligibility facts");
  if (eligibility.roles.length > 0) {
    assertEligibilityPathList(eligibility.roles, "source eligibility roles");
  }
  if (eligibility.meta.length > 0) {
    assertEligibilityPathList(eligibility.meta, "source eligibility meta");
  }

  const allowedSources = eligiblePathSet(eligibility);
  const manifest = loadPublicationManifest();
  if (!Array.isArray(manifest.snapshots) || manifest.snapshots.length === 0) {
    throw new Error(
      "Career publication manifest must list at least one snapshot",
    );
  }

  const manifestFiles = new Set();
  const manifestSnapshotPaths = [];

  for (const entry of manifest.snapshots) {
    assertSafeCareerInventoryRelativePath(entry.file, "snapshot_file");
    if (manifestFiles.has(entry.file)) {
      throw new Error(
        `Duplicate snapshot path in career publication manifest: ${entry.file}`,
      );
    }
    manifestFiles.add(entry.file);
    manifestSnapshotPaths.push(entry.file);

    assertNonEmptyUniqueStringList(
      entry.source_eligibility,
      `source_eligibility for ${entry.file}`,
    );
    for (const sourcePath of entry.source_eligibility) {
      assertSafeCareerInventoryRelativePath(sourcePath, "eligible_source");
    }

    assertNonEmptyUniqueStringList(
      entry.approved_entry_ids,
      `approved_entry_ids for ${entry.file}`,
    );

    const { absolutePath, parsed } = readSnapshotFrontmatter(entry.file);

    const onDiskHash = sha256File(absolutePath);
    if (onDiskHash !== entry.sha256) {
      throw new Error(
        `Career snapshot hash mismatch for ${entry.file} — refresh publication-manifest.json after review`,
      );
    }

    if (parsed.inventory_fact_id !== entry.inventory_fact_id) {
      throw new Error(
        `Career snapshot inventory_fact_id mismatch in ${entry.file}`,
      );
    }
    if (parsed.inventory_role_id !== entry.inventory_role_id) {
      throw new Error(
        `Career snapshot inventory_role_id mismatch in ${entry.file}`,
      );
    }

    for (const sourcePath of entry.source_eligibility) {
      if (!allowedSources.has(sourcePath)) {
        throw new Error(
          `Publication manifest references ineligible source ${sourcePath} (${entry.file})`,
        );
      }
    }

    const frontmatterEligibility = parsed.source_eligibility ?? [];
    const expectedEligibility = entry.source_eligibility
      .slice()
      .sort()
      .join("\n");
    const actualEligibility = [...frontmatterEligibility].sort().join("\n");
    if (expectedEligibility !== actualEligibility) {
      throw new Error(
        `Career snapshot source_eligibility frontmatter does not match publication manifest for ${entry.file}`,
      );
    }

    const approvedInFrontmatter = parsed.approved_entry_ids ?? [];
    const expectedApproved = entry.approved_entry_ids.slice().sort().join("\n");
    const actualApproved = [...approvedInFrontmatter].sort().join("\n");
    if (expectedApproved !== actualApproved) {
      throw new Error(
        `Career snapshot approved_entry_ids frontmatter does not match publication manifest for ${entry.file}`,
      );
    }

    const factPath = `facts/${entry.inventory_fact_id}.yml`;
    if (!eligibility.facts.includes(factPath)) {
      throw new Error(
        `Published fact ${entry.inventory_fact_id} is not on the source eligibility allowlist`,
      );
    }

    const rolePath = `roles/${entry.inventory_role_id}.yml`;
    if (!eligibility.roles.includes(rolePath)) {
      throw new Error(
        `Published role ${entry.inventory_role_id} is not on the source eligibility allowlist`,
      );
    }
  }

  if (fs.existsSync(CAREER_SNAPSHOTS_DIR)) {
    for (const fileName of fs.readdirSync(CAREER_SNAPSHOTS_DIR).sort()) {
      if (!fileName.endsWith(".md")) continue;
      const relative = `snapshots/${fileName}`;
      if (!manifestFiles.has(relative)) {
        throw new Error(
          `Orphan career inventory snapshot without publication approval: ${relative}`,
        );
      }
    }
  }

  if (new Set(manifestSnapshotPaths).size !== manifestSnapshotPaths.length) {
    throw new Error("Duplicate snapshot path in career publication manifest");
  }

  const factIds = manifest.snapshots.map((entry) => entry.inventory_fact_id);
  if (new Set(factIds).size !== factIds.length) {
    throw new Error(
      "Duplicate inventory_fact_id in career publication manifest",
    );
  }
}

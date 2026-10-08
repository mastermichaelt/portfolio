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
 * Fail closed when eligibility, publication manifest, or snapshot freshness diverge.
 * Producers must call this before emitting OKF concepts.
 */
export function assertCareerInventoryPublicationIntegrity() {
  const eligibility = loadSourceEligibility();
  if (eligibility.default !== "deny") {
    throw new Error(
      "Career source eligibility must default to deny (fail closed)",
    );
  }

  const allowedSources = eligiblePathSet(eligibility);
  const manifest = loadPublicationManifest();
  const manifestFiles = new Set();

  for (const entry of manifest.snapshots) {
    manifestFiles.add(entry.file);
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

  const factIds = manifest.snapshots.map((entry) => entry.inventory_fact_id);
  if (new Set(factIds).size !== factIds.length) {
    throw new Error(
      "Duplicate inventory_fact_id in career publication manifest",
    );
  }
}

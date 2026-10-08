import fs from "node:fs";
import path from "node:path";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";
import {
  assertCareerInventoryPublicationIntegrity,
  CAREER_INVENTORY_DIR,
  loadPublicationManifest,
} from "./career-inventory-manifest.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

const CAREER_RESOURCE = `${SITE_URL}/about`;

function careerSource(inventoryFactId, title) {
  return {
    id: `career-inventory-${inventoryFactId}`,
    title,
    resource: CAREER_RESOURCE,
  };
}

function readPublishedSnapshot(relativePath) {
  const absolutePath = path.join(CAREER_INVENTORY_DIR, relativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Career inventory snapshot missing YAML frontmatter: ${relativePath}`,
    );
  }
  const metadata = parseSimpleFrontmatter(frontmatter);
  return { metadata, body: body.trim() };
}

function buildFactConcept(entry) {
  const { metadata, body } = readPublishedSnapshot(entry.file);
  const inventoryFactId = entry.inventory_fact_id;
  const title = metadata.title ?? entry.inventory_fact_id;

  return {
    id: `career/${inventoryFactId}`,
    frontmatter: {
      type: "Career Inventory Evidence",
      title,
      resource: CAREER_RESOURCE,
      sources: [careerSource(inventoryFactId, title)],
      generated: { by: GENERATED_BY },
      tags: [
        "career",
        "inventory",
        inventoryFactId,
        `role:${entry.inventory_role_id}`,
      ],
      inventory: {
        fact_id: inventoryFactId,
        role_id: entry.inventory_role_id,
        approved_entry_ids: entry.approved_entry_ids,
      },
    },
    body,
  };
}

/**
 * Produce OKF concepts from reviewed public career-inventory snapshots only.
 * Does not read the private resumes repository.
 *
 * @returns {import("./writer.mjs").OkfConcept[]}
 */
export function produceCareerInventoryConcepts() {
  assertCareerInventoryPublicationIntegrity();
  const manifest = loadPublicationManifest();
  return manifest.snapshots
    .slice()
    .sort((a, b) => a.inventory_fact_id.localeCompare(b.inventory_fact_id))
    .map((entry) => buildFactConcept(entry));
}

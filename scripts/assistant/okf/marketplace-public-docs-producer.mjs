import fs from "node:fs";
import path from "node:path";

import { GENERATED_BY, marketplaceUpstreamResource } from "./constants.mjs";
import {
  assertMarketplacePublicationIntegrity,
  loadMarketplacePublicationManifest,
  MARKETPLACE_PUBLIC_DOCS_DIR,
} from "./marketplace-public-docs-manifest.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

function marketplaceSource(slug, title, upstreamPath) {
  return {
    id: `cursor-team-marketplace-${slug}`,
    title,
    resource: marketplaceUpstreamResource(upstreamPath),
  };
}

function readPublishedSnapshot(relativePath) {
  const absolutePath = path.join(MARKETPLACE_PUBLIC_DOCS_DIR, relativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Marketplace snapshot missing YAML frontmatter: ${relativePath}`,
    );
  }
  const metadata = parseSimpleFrontmatter(frontmatter);
  return { metadata, body: body.trim() };
}

function buildConcept(entry, manifest) {
  const { metadata, body } = readPublishedSnapshot(entry.file);
  const slug = entry.concept_slug;
  const title = metadata.title ?? slug;
  const upstreamPath = entry.upstream_path;
  const resource = marketplaceUpstreamResource(upstreamPath);

  return {
    id: `tooling/${slug}`,
    frontmatter: {
      type: "Public Repository Documentation",
      title,
      resource,
      sources: [marketplaceSource(slug, title, upstreamPath)],
      generated: { by: GENERATED_BY },
      tags: ["tooling", "cursor-team-marketplace", "team-harness"],
      upstream: {
        repo: manifest.upstream_repo,
        path: upstreamPath,
      },
    },
    body,
  };
}

/**
 * Produce OKF concepts from pinned cursor-team-marketplace public docs only.
 * Does not fetch the upstream repository in CI.
 *
 * @returns {import("./writer.mjs").OkfConcept[]}
 */
export function produceMarketplacePublicDocsConcepts() {
  assertMarketplacePublicationIntegrity();
  const manifest = loadMarketplacePublicationManifest();
  return manifest.snapshots
    .slice()
    .sort((a, b) => a.concept_slug.localeCompare(b.concept_slug))
    .map((entry) => buildConcept(entry, manifest));
}

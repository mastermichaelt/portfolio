import fs from "node:fs";
import path from "node:path";

import { GENERATED_BY, savepointsUpstreamResource } from "./constants.mjs";
import {
  assertSavepointsPublicationIntegrity,
  loadSavepointsPublicationManifest,
  SAVEPOINTS_PUBLIC_NOTES_DIR,
} from "./savepoints-public-notes-manifest.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

function savepointsSource(slug, title, upstreamPath) {
  return {
    id: `savepoints-${slug}`,
    title,
    resource: savepointsUpstreamResource(upstreamPath),
  };
}

function readPublishedSnapshot(relativePath) {
  const absolutePath = path.join(SAVEPOINTS_PUBLIC_NOTES_DIR, relativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Savepoints snapshot missing YAML frontmatter: ${relativePath}`,
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
  const resource = savepointsUpstreamResource(upstreamPath);

  return {
    id: `tooling/${slug}`,
    frontmatter: {
      type: "Public Repository Documentation",
      title,
      resource,
      sources: [savepointsSource(slug, title, upstreamPath)],
      generated: { by: GENERATED_BY },
      tags: ["tooling", "savepoints", "agent-memory"],
      upstream: {
        repo: manifest.upstream_repo,
        path: upstreamPath,
        publication_kind: metadata.publication_kind ?? "reviewed-excerpt",
      },
    },
    body,
  };
}

/**
 * Produce OKF concepts from pinned Savepoints public excerpts only.
 * Does not fetch the upstream repository in CI.
 *
 * @returns {import("./writer.mjs").OkfConcept[]}
 */
export function produceSavepointsPublicNotesConcepts() {
  assertSavepointsPublicationIntegrity();
  const manifest = loadSavepointsPublicationManifest();
  return manifest.snapshots
    .slice()
    .sort((a, b) => a.concept_slug.localeCompare(b.concept_slug))
    .map((entry) => buildConcept(entry, manifest));
}

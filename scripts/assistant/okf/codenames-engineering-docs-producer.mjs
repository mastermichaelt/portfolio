import {
  CODENAMES_REPO,
  codenamesUpstreamResource,
  GENERATED_BY,
} from "./constants.mjs";
import {
  assertCodenamesPublicationIntegrity,
  loadCodenamesPublicationManifest,
  readPinnedCodenamesSource,
} from "./codenames-engineering-docs-manifest.mjs";

const PIPELINE_OUTCOME_SOURCE = "sources/ai-pipeline-outcome.md";
const VALIDATION_FLOW_SOURCE = "sources/judge-ai-validation-flow.md";

function codenamesSource(slug, title, upstreamPath) {
  return {
    id: `codenames-ai-${slug}`,
    title,
    resource: codenamesUpstreamResource(upstreamPath),
  };
}

function extractSection(markdown, startHeading, endHeading) {
  const start = markdown.indexOf(startHeading);
  if (start === -1) {
    throw new Error(`Section not found: ${startHeading.trim()}`);
  }
  const contentStart = start + startHeading.length;
  const end = endHeading ? markdown.indexOf(endHeading, contentStart) : -1;
  if (endHeading && end === -1) {
    throw new Error(`End section not found: ${endHeading.trim()}`);
  }
  const slice =
    end === -1
      ? markdown.slice(contentStart)
      : markdown.slice(contentStart, end);
  return slice.trim();
}

function buildConcept(id, type, title, body, tags, upstreamPath) {
  const slug = id.replace(/^repo\//, "").replace(/^codenames-ai-/, "");
  return {
    id: `repo/${id}`,
    frontmatter: {
      type,
      title,
      resource: codenamesUpstreamResource(upstreamPath),
      sources: [codenamesSource(slug, title, upstreamPath)],
      generated: { by: GENERATED_BY },
      tags,
      upstream: {
        repo: CODENAMES_REPO,
        path: upstreamPath,
      },
    },
    body,
  };
}

function producePipelineOutcomeConcept() {
  const upstreamPath = "docs/ai-pipeline-outcome.md";
  const markdown = readPinnedCodenamesSource(PIPELINE_OUTCOME_SOURCE);
  const body = markdown.trim();

  return buildConcept(
    "codenames-ai-pipeline-outcome",
    "Engineering Documentation",
    "Codenames AI — ai_pipeline_outcome telemetry schema",
    `${body}

Related portfolio case: [Validation and outcomes](/portfolio/codenames-ai-b01-validation.md).`,
    ["codenames-ai", "repo", "telemetry", "validation"],
    upstreamPath,
  );
}

function produceValidationFlowConcept() {
  const upstreamPath = "docs/judge-ai-validation-flow.md";
  const markdown = readPinnedCodenamesSource(VALIDATION_FLOW_SOURCE);

  const preamble = extractSection(
    markdown,
    "# Judge AI / validation flow (Solo vs JUDGE)\n\n",
    "\n---\n\n## Architecture overview\n",
  );
  const validationAndResponse = extractSection(
    markdown,
    "## Validation layers\n",
    "\n---\n\n## Related mode: STRANGE\n",
  );

  const body = `# Judge AI / validation flow (Solo vs JUDGE)

${preamble}

## Validation layers

${validationAndResponse}

Related portfolio case: [Validation and outcomes](/portfolio/codenames-ai-b01-validation.md).`;

  return buildConcept(
    "codenames-ai-validation-flow",
    "Engineering Documentation",
    "Codenames AI — judge and deterministic validation flow",
    body,
    ["codenames-ai", "repo", "validation", "judge"],
    upstreamPath,
  );
}

/**
 * Produce OKF concepts from pinned Codenames engineering docs only.
 * Does not fetch the upstream repository in CI.
 *
 * @returns {import("./writer.mjs").OkfConcept[]}
 */
export function produceCodenamesEngineeringDocsConcepts() {
  assertCodenamesPublicationIntegrity();
  loadCodenamesPublicationManifest();

  return [producePipelineOutcomeConcept(), produceValidationFlowConcept()].sort(
    (a, b) => a.id.localeCompare(b.id),
  );
}

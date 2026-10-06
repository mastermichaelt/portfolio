import fs from "node:fs";
import path from "node:path";

import {
  FIXTURE_FILES,
  FIXTURES_DIR,
  GENERATED_BY,
  REPO_RUNBOOK_RESOURCE,
} from "./constants.mjs";

const SOURCE_ID = "renovate-workflow-runbook";

function repoSource(title = "Renovate PR workflow (manual)") {
  return {
    id: SOURCE_ID,
    title,
    resource: REPO_RUNBOOK_RESOURCE,
  };
}

function extractSection(markdown, startHeading, endHeading) {
  const start = markdown.indexOf(startHeading);
  if (start === -1) {
    throw new Error(`Section not found: ${startHeading}`);
  }
  const contentStart = start + startHeading.length;
  const end = endHeading ? markdown.indexOf(endHeading, contentStart) : -1;
  const slice =
    end === -1
      ? markdown.slice(contentStart)
      : markdown.slice(contentStart, end);
  return slice.trim();
}

function buildConcept(id, type, title, body, tags) {
  return {
    id: `repo/${id}`,
    frontmatter: {
      type,
      title,
      resource: REPO_RUNBOOK_RESOURCE,
      sources: [repoSource(title)],
      generated: { by: GENERATED_BY },
      tags,
    },
    body,
  };
}

/**
 * Map the pinned runbook into semantic OKF concepts.
 * Headings are guides, not automatic concept boundaries — see INSPECTION.md.
 */
export function produceRepoConcepts(fixtureRoot = FIXTURES_DIR) {
  const fixturePath = path.join(fixtureRoot, FIXTURE_FILES.renovateWorkflow);
  const markdown = fs.readFileSync(fixturePath, "utf8");

  const overview = extractSection(
    markdown,
    "# Renovate PR workflow (manual)\n",
    "## Prerequisites\n",
  );
  const prerequisites = extractSection(
    markdown,
    "## Prerequisites\n",
    "## Workflow\n",
  );
  const workflow = extractSection(
    markdown,
    "## Workflow\n",
    "## Automated ladder (optional)\n",
  );
  const automationAndPolicy = extractSection(
    markdown,
    "## Automated ladder (optional)\n",
    "## When the agent stops (troubleshooting)\n",
  );
  const troubleshooting = extractSection(
    markdown,
    "## When the agent stops (troubleshooting)\n",
    "## What can be merged automatically (summary)\n",
  );
  const mergePolicy = extractSection(
    markdown,
    "## What can be merged automatically (summary)\n",
    "## Skill naming (canonical)\n",
  );

  return [
    buildConcept(
      "renovate-workflow-overview",
      "Runbook",
      "Renovate PR workflow — overview",
      `${overview}

Related portfolio case: [Renovate governance ladder](/portfolio/renovate-governance-case.md).`,
      ["renovate-workflow", "repo", "overview"],
    ),
    buildConcept(
      "renovate-workflow-prerequisites",
      "Runbook Section",
      "Renovate PR workflow — prerequisites",
      prerequisites,
      ["renovate-workflow", "repo", "prerequisites"],
    ),
    buildConcept(
      "renovate-workflow-operator-ladder",
      "Runbook Section",
      "Renovate PR workflow — operator ladder",
      `${workflow}

Pairs with portfolio blocks on merge authority and investigation lanes: [Constraints](/portfolio/renovate-governance-b04-constraints.md), [Operation](/portfolio/renovate-governance-b05-operation.md).`,
      ["renovate-workflow", "repo", "workflow"],
    ),
    buildConcept(
      "renovate-workflow-automation-and-policy",
      "Runbook Section",
      "Renovate PR workflow — automation and policy summary",
      automationAndPolicy,
      ["renovate-workflow", "repo", "automation", "policy"],
    ),
    buildConcept(
      "renovate-workflow-troubleshooting",
      "Runbook Section",
      "Renovate PR workflow — troubleshooting",
      `${troubleshooting}

${mergePolicy}`,
      ["renovate-workflow", "repo", "troubleshooting"],
    ),
  ];
}

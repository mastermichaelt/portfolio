import {
  entities,
  relationships,
  workflowViews,
} from "../../../content/ecosystem.ts";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";

const ECOSYSTEM_RESOURCE = `${SITE_URL}/ecosystem`;

function ecosystemSource() {
  return {
    id: "portfolio-ecosystem",
    title: "Ecosystem map",
    resource: ECOSYSTEM_RESOURCE,
  };
}

function formatEntity(entity) {
  const evidence = entity.evidence
    ?.map((item) => `- ${item.label}: ${item.url}`)
    .join("\n");
  const related = entity.relatedProjectSlug
    ? `Related project: ${entity.relatedProjectSlug}.`
    : "";
  const evidenceBlock = evidence ? `\n\nEvidence:\n${evidence}` : "";
  return `### ${entity.name} (\`${entity.id}\`, ${entity.kind})

${entity.summary}${related ? ` ${related}` : ""}${evidenceBlock}`;
}

function formatRelationship(relationship) {
  const label = relationship.label ? ` — ${relationship.label}` : "";
  return `- \`${relationship.fromId}\` → \`${relationship.toId}\`${label}`;
}

function formatWorkflowNode(node) {
  const entity = node.entityId ? ` entity: \`${node.entityId}\`` : "";
  const project = node.relatedProjectSlug
    ? ` project: ${node.relatedProjectSlug}`
    : "";
  return `- **${node.label}** (${node.kind})${entity}${project}${node.subtitle ? ` — ${node.subtitle}` : ""}`;
}

function formatWorkflowEdge(edge) {
  const label = edge.label ? ` (${edge.label})` : "";
  return `- \`${edge.source}\` → \`${edge.target}\`${label}`;
}

/** Produce OKF concepts from the ecosystem inventory and curated workflow views. */
export function produceEcosystemConcepts() {
  const entityInventory = {
    id: "portfolio/ecosystem-entity-inventory",
    frontmatter: {
      type: "Ecosystem Inventory",
      title: "Ecosystem — entities",
      resource: ECOSYSTEM_RESOURCE,
      sources: [ecosystemSource()],
      generated: { by: GENERATED_BY },
      tags: ["ecosystem", "portfolio", "entities"],
    },
    body: `Curated entities on the ecosystem map (${entities.length} nodes). Layout coordinates and React Flow wiring are omitted.

${entities.map(formatEntity).join("\n\n")}`,
  };

  const relationshipGraph = {
    id: "portfolio/ecosystem-relationship-graph",
    frontmatter: {
      type: "Ecosystem Relationships",
      title: "Ecosystem — relationships",
      resource: ECOSYSTEM_RESOURCE,
      sources: [ecosystemSource()],
      generated: { by: GENERATED_BY },
      tags: ["ecosystem", "portfolio", "relationships"],
    },
    body: `Directed relationships between ecosystem entities (${relationships.length} edges).

${relationships.map(formatRelationship).join("\n")}`,
  };

  const viewConcepts = workflowViews.map((view) => ({
    id: `portfolio/ecosystem-view-${view.id}`,
    frontmatter: {
      type: "Ecosystem Workflow View",
      title: `Ecosystem — ${view.title}`,
      resource: `${ECOSYSTEM_RESOURCE}#${view.id}`,
      sources: [ecosystemSource()],
      generated: { by: GENERATED_BY },
      tags: ["ecosystem", "portfolio", "workflow-view", view.id],
    },
    body: `${view.summary}

Talk track: ${view.talkTrack}

## Nodes

${view.nodes.map(formatWorkflowNode).join("\n")}

## Edges

${view.edges.map(formatWorkflowEdge).join("\n")}

Interactive canvas positions are not embedded; see the live ecosystem page for layout.`,
  }));

  return [entityInventory, relationshipGraph, ...viewConcepts];
}

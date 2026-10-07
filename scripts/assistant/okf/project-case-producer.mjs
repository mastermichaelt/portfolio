import { projectCases } from "../../../content/project-cases.ts";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";

const PROJECT_CASE_SLUGS = ["experiment-measurement", "codenames-ai"];

function portfolioResource(slug, blockId) {
  const hash = blockId ? `#${blockId}` : "";
  return `${SITE_URL}/projects/${slug}${hash}`;
}

function portfolioSource(slug, title) {
  return {
    id: `portfolio-${slug}`,
    title,
    resource: portfolioResource(slug),
  };
}

function figureLines(figures) {
  if (!figures?.length) {
    return [];
  }
  return figures.map(
    (figure) => `${figure.value} — ${figure.name} (${figure.scope})`,
  );
}

function formatCaseNote(note) {
  if (!note) {
    return "";
  }
  const closing = note.closing ? ` — ${note.closing}` : "";
  return `${note.label}: ${note.lines.join("; ")}${closing}`;
}

/** Render one ProjectCase CaseBlock as OKF body text (heading-first, not proseBody). */
export function caseBlockBody(block) {
  const parts = [block.heading, ...block.body];
  if (block.contract) {
    parts.push(`Contract: ${block.contract}`);
  }
  const note = formatCaseNote(block.note);
  if (note) {
    parts.push(note);
  }
  parts.push(...figureLines(block.figures));
  return parts.filter(Boolean).join("\n\n");
}

function artifactsSummary(artifacts) {
  if (!artifacts?.rows?.length) {
    return "";
  }
  const labels = artifacts.rows.map((row) => row.label).join("; ");
  return `## ${artifacts.label}\n\n${labels}`;
}

function buildCaseOverview(caseStudy) {
  const asideLines = caseStudy.aside.lines.join("\n- ");
  const elsewhere = caseStudy.elsewhere
    .map((link) => `- [${link.label}](${link.href})`)
    .join("\n");
  const artifacts = artifactsSummary(caseStudy.artifacts);

  const sections = [
    caseStudy.lead,
    `## Aside — ${caseStudy.aside.label}\n\n- ${asideLines}\n\n${caseStudy.aside.note}`,
    `## Elsewhere\n\n${elsewhere}`,
  ];
  if (artifacts) {
    sections.push(artifacts);
  }

  return {
    id: `portfolio/${caseStudy.slug}-case`,
    frontmatter: {
      type: "Project Case",
      title: caseStudy.name,
      resource: portfolioResource(caseStudy.slug),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: [caseStudy.slug, "portfolio", "project-case"],
    },
    body: sections.join("\n\n"),
  };
}

function buildBlockConcept(caseStudy, block) {
  return {
    id: `portfolio/${caseStudy.slug}-${block.id}-${block.category.toLowerCase()}`,
    frontmatter: {
      type: "Project Case Block",
      title: `${caseStudy.name} — ${block.category}`,
      resource: portfolioResource(caseStudy.slug, block.id),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: [
        caseStudy.slug,
        "portfolio",
        "project-case",
        block.category.toLowerCase(),
        block.id,
      ],
    },
    body: caseBlockBody(block),
  };
}

/** Produce OKF concepts for bounded co-primary project cases. */
export function produceProjectCaseConcepts() {
  const concepts = [];

  for (const slug of PROJECT_CASE_SLUGS) {
    const caseStudy = projectCases.find((entry) => entry.slug === slug);
    if (!caseStudy) {
      throw new Error(`Project case not found: ${slug}`);
    }

    concepts.push(buildCaseOverview(caseStudy));
    for (const block of caseStudy.blocks) {
      concepts.push(buildBlockConcept(caseStudy, block));
    }
  }

  return concepts;
}

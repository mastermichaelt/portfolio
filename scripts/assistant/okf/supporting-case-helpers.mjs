import { GENERATED_BY, SITE_URL } from "./constants.mjs";

export function portfolioResource(slug, blockId) {
  const hash = blockId ? `#${blockId}` : "";
  return `${SITE_URL}/projects/${slug}${hash}`;
}

export function portfolioSource(slug, title) {
  return {
    id: `portfolio-${slug}`,
    title,
    resource: portfolioResource(slug),
  };
}

export function proseBody(block) {
  const parts = [block.lead, ...block.body];
  if (block.contract) {
    parts.push(`Contract: ${block.contract}`);
  }
  if (block.note) {
    parts.push(
      `${block.note.label}: ${block.note.lines.join("; ")}${block.note.closing ? ` — ${block.note.closing}` : ""}`,
    );
  }
  return parts.filter(Boolean).join("\n\n");
}

export function buildSupportingCaseOverview(caseStudy, seeAlsoLines = []) {
  const asideLines = caseStudy.aside.lines.join("\n- ");
  const elsewhere = caseStudy.elsewhere
    .map((link) => `- [${link.label}](${link.href})`)
    .join("\n");
  const seeAlso = seeAlsoLines.length
    ? `\n\nSee also:\n\n${seeAlsoLines.map((line) => `- ${line}`).join("\n")}`
    : "";

  return {
    id: `portfolio/${caseStudy.slug}-case`,
    frontmatter: {
      type: "Case Study",
      title: caseStudy.title,
      resource: portfolioResource(caseStudy.slug),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: [caseStudy.slug, "portfolio", "supporting-case"],
    },
    body: `${caseStudy.lead}

## Aside — ${caseStudy.aside.label}

- ${asideLines}

${caseStudy.aside.note}

## Elsewhere

${elsewhere}${seeAlso}`,
  };
}

export function buildSupportingProseConcept(caseStudy, block) {
  return {
    id: `portfolio/${caseStudy.slug}-${block.id}-${block.category.toLowerCase()}`,
    frontmatter: {
      type: "Case Study Block",
      title: `${caseStudy.name} — ${block.category}`,
      resource: portfolioResource(caseStudy.slug, block.id),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: [
        caseStudy.slug,
        "portfolio",
        block.category.toLowerCase(),
        block.id,
      ],
    },
    body: proseBody(block),
  };
}

export function buildSupportingArchitectureConcept(caseStudy, block) {
  const notes = [];
  if (block.provenance?.includes("ecosystem")) {
    notes.push(
      `See the [ecosystem map](${SITE_URL}/ecosystem) for node-level detail.`,
    );
  }
  if (caseStudy.slug === "renovate-governance") {
    notes.push(
      "See the [Renovate workflow runbook](/repo/renovate-workflow-overview.md) for operator steps.",
    );
  }
  const footer = notes.length
    ? `\n\n${notes.join(" ")}`
    : "\n\nThe interactive workflow canvas is not embedded here.";

  return {
    id: `portfolio/${caseStudy.slug}-${block.id}-architecture`,
    frontmatter: {
      type: "Case Study Architecture",
      title: `${caseStudy.name} — ${block.category}`,
      resource: portfolioResource(caseStudy.slug, block.id),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: [caseStudy.slug, "portfolio", "architecture", block.id],
    },
    body: `${block.defaultSub}

${block.defaultSummary}

Provenance: ${block.provenance}. Legend kinds: ${block.legendKinds}.${footer}`,
  };
}

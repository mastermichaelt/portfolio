import { articles } from "../../../content/articles.ts";
import { supportingCases } from "../../../content/supporting-cases.ts";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";

const CASE_SLUG = "renovate-governance";
const ARTICLE_SLUG = "evidence-driven-dependency-upgrades";

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

function proseBody(block) {
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

function buildCaseOverview(caseStudy) {
  const asideLines = caseStudy.aside.lines.join("\n- ");
  const elsewhere = caseStudy.elsewhere
    .map((link) => `- [${link.label}](${link.href})`)
    .join("\n");

  return {
    id: "portfolio/renovate-governance-case",
    frontmatter: {
      type: "Case Study",
      title: caseStudy.title,
      resource: portfolioResource(caseStudy.slug),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: ["renovate-governance", "portfolio", "supporting-case"],
    },
    body: `${caseStudy.lead}

## Aside — ${caseStudy.aside.label}

- ${asideLines}

${caseStudy.aside.note}

## Elsewhere

${elsewhere}

See also: [Evidence-driven dependency upgrades (catalog)](/writing/evidence-driven-dependency-upgrades-metadata.md), [Renovate workflow runbook](/repo/renovate-workflow-overview.md).`,
  };
}

function buildProseConcept(caseStudy, block) {
  return {
    id: `portfolio/renovate-governance-${block.id}-${block.category.toLowerCase()}`,
    frontmatter: {
      type: "Case Study Block",
      title: `${caseStudy.name} — ${block.category}`,
      resource: portfolioResource(caseStudy.slug, block.id),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: [
        "renovate-governance",
        "portfolio",
        block.category.toLowerCase(),
        block.id,
      ],
    },
    body: proseBody(block),
  };
}

function buildArchitectureConcept(caseStudy, block) {
  return {
    id: `portfolio/renovate-governance-${block.id}-architecture`,
    frontmatter: {
      type: "Case Study Architecture",
      title: `${caseStudy.name} — ${block.category}`,
      resource: portfolioResource(caseStudy.slug, block.id),
      sources: [portfolioSource(caseStudy.slug, caseStudy.name)],
      generated: { by: GENERATED_BY },
      tags: ["renovate-governance", "portfolio", "architecture", block.id],
    },
    body: `${block.defaultSub}

${block.defaultSummary}

Provenance: ${block.provenance}. Legend kinds: ${block.legendKinds}.

The interactive workflow canvas is not embedded here. See the [ecosystem map](${SITE_URL}/ecosystem) for node-level detail and the [Renovate workflow runbook](/repo/renovate-workflow-overview.md) for operator steps.`,
  };
}

function buildArticleCatalogConcept(article) {
  return {
    id: "portfolio/evidence-driven-dependency-upgrades-catalog",
    frontmatter: {
      type: "Article Catalog Entry",
      title: article.title,
      resource: article.url,
      sources: [
        {
          id: "portfolio-articles-index",
          title: "Portfolio articles index",
          resource: `${SITE_URL}/articles`,
        },
        {
          id: "portfolio-renovate-governance",
          title: "Renovate governance ladder",
          resource: portfolioResource(CASE_SLUG),
        },
      ],
      generated: { by: GENERATED_BY },
      tags: ["evidence-driven-dependency-upgrades", "portfolio", "catalog"],
    },
    body: `${article.summary}

Year: ${article.year}. Tags: ${article.tags.join(", ")}. Related project: ${article.relatedProjectSlug}. Portfolio line: ${article.line}.

Full narrative: [Evidence-driven dependency upgrades](/writing/evidence-driven-dependency-upgrades-article.md).`,
  };
}

/** Produce OKF concepts from in-repo portfolio content only. */
export function producePortfolioConcepts() {
  const caseStudy = supportingCases.find((entry) => entry.slug === CASE_SLUG);
  if (!caseStudy) {
    throw new Error(`Supporting case not found: ${CASE_SLUG}`);
  }

  const article = articles.find((entry) => entry.slug === ARTICLE_SLUG);
  if (!article) {
    throw new Error(`Article catalog row not found: ${ARTICLE_SLUG}`);
  }

  const concepts = [buildCaseOverview(caseStudy)];

  for (const block of caseStudy.blocks) {
    if (block.type === "prose") {
      concepts.push(buildProseConcept(caseStudy, block));
      continue;
    }
    if (block.type === "architecture") {
      concepts.push(buildArchitectureConcept(caseStudy, block));
    }
  }

  concepts.push(buildArticleCatalogConcept(article));
  return concepts;
}

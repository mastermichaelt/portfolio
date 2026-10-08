import { articles } from "../../../content/articles.ts";
import { supportingCases } from "../../../content/supporting-cases.ts";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";
import {
  buildSupportingArchitectureConcept,
  buildSupportingCaseOverview,
  buildSupportingProseConcept,
  portfolioResource,
} from "./supporting-case-helpers.mjs";

function seeAlsoForCase(slug) {
  if (slug === "renovate-governance") {
    return [
      "[Evidence-driven dependency upgrades (catalog)](/writing/evidence-driven-dependency-upgrades-metadata.md)",
      "[Renovate workflow runbook](/repo/renovate-workflow-overview.md)",
    ];
  }
  if (slug === "editorial-workflow") {
    return [
      "[The AI reviewer scored 23/25 (article)](/writing/reviewers-analysis-before-scoring-article.md)",
    ];
  }
  return [];
}

function buildArticleCatalogConcept(article) {
  const relatedLine = article.relatedProjectSlug
    ? `Related project: ${article.relatedProjectSlug}.`
    : "Related project: (none listed).";
  const sources = [
    {
      id: "portfolio-articles-index",
      title: "Portfolio articles index",
      resource: `${SITE_URL}/articles`,
    },
  ];
  if (article.relatedProjectSlug) {
    sources.push({
      id: `portfolio-${article.relatedProjectSlug}`,
      title: article.relatedProjectSlug,
      resource: portfolioResource(article.relatedProjectSlug),
    });
  }

  return {
    id: `portfolio/${article.slug}-catalog`,
    frontmatter: {
      type: "Article Catalog Entry",
      title: article.title,
      resource: article.url,
      sources,
      generated: { by: GENERATED_BY },
      tags: [article.slug, "portfolio", "catalog"],
    },
    body: `${article.summary}

Year: ${article.year}. Tags: ${article.tags.join(", ")}. ${relatedLine} Portfolio line: ${article.line}.

Full narrative: [${article.title}](/writing/${article.slug}-article.md).`,
  };
}

function conceptsForSupportingCase(caseStudy) {
  const concepts = [
    buildSupportingCaseOverview(caseStudy, seeAlsoForCase(caseStudy.slug)),
  ];

  for (const block of caseStudy.blocks) {
    if (block.type === "prose") {
      concepts.push(buildSupportingProseConcept(caseStudy, block));
      continue;
    }
    if (block.type === "architecture") {
      concepts.push(buildSupportingArchitectureConcept(caseStudy, block));
    }
  }

  return concepts;
}

/** Produce OKF concepts from in-repo portfolio content (cases + article catalog). */
export function producePortfolioConcepts() {
  const concepts = [];

  for (const caseStudy of supportingCases) {
    concepts.push(...conceptsForSupportingCase(caseStudy));
  }

  for (const article of articles) {
    concepts.push(buildArticleCatalogConcept(article));
  }

  return concepts;
}

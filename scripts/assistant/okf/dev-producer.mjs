import fs from "node:fs";

import { articles } from "../../../content/articles.ts";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";
import {
  assertPublishedArticleFixtureCoverage,
  publishedArticleFixturePath,
} from "./published-articles.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

function stripHtmlComments(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildMetadataConcept(article, metadata) {
  const tagList = Array.isArray(metadata.tags)
    ? metadata.tags
    : metadata.tags
      ? [metadata.tags]
      : [];

  return {
    id: `writing/${article.slug}-metadata`,
    frontmatter: {
      type: "Published Article Metadata",
      title: metadata.title ?? article.title,
      resource: article.url,
      sources: [
        {
          id: `dev-article-${article.slug}`,
          title: metadata.title ?? article.title,
          resource: article.url,
        },
        {
          id: "portfolio-articles-index",
          title: "Portfolio articles index",
          resource: `${SITE_URL}/articles`,
        },
      ],
      generated: { by: GENERATED_BY },
      tags: [article.slug, "writing", "metadata"],
    },
    body: `Editorial hub metadata preserved from the pinned fixture frontmatter.

- Notion page: ${metadata.notion_page ?? "(not recorded)"}
- DEV article id: ${metadata.devto_article_id ?? "(not recorded)"}
- Last DEV sync: ${metadata.last_devto_sync ?? "(not recorded)"}
- Tags: ${tagList.join(", ") || "(none)"}
- Portfolio catalog: [Article catalog entry](/portfolio/${article.slug}-catalog.md)${article.relatedProjectSlug ? `\n- Related project: [${article.relatedProjectSlug}](/portfolio/${article.relatedProjectSlug}-case.md)` : ""}

HTML comments from the fixture body are stripped in the narrative concept; editorial drafting notes are not part of OKF knowledge.`,
  };
}

function buildArticleConcept(article, body) {
  const cleaned = stripHtmlComments(body);
  const related =
    article.relatedProjectSlug === "renovate-governance"
      ? `\n\nRelated runbook: [Renovate workflow overview](/repo/renovate-workflow-overview.md).`
      : "";

  return {
    id: `writing/${article.slug}-article`,
    frontmatter: {
      type: "Published Article",
      title: article.title,
      resource: article.url,
      sources: [
        {
          id: `dev-article-${article.slug}`,
          title: article.title,
          resource: article.url,
        },
      ],
      generated: { by: GENERATED_BY },
      tags: [article.slug, "writing", "field-report"],
    },
    body: `${cleaned}${related}`,
  };
}

function readPublishedFixture(slug) {
  const fixturePath = publishedArticleFixturePath(slug);
  const raw = fs.readFileSync(fixturePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(
      `Published article fixture missing YAML frontmatter: ${slug}`,
    );
  }
  return { metadata: parseSimpleFrontmatter(frontmatter), body };
}

/** Produce OKF concepts from pinned DEV article bodies for every portfolio article row. */
export function produceDevConcepts() {
  assertPublishedArticleFixtureCoverage();

  const concepts = [];
  for (const article of articles) {
    const { metadata, body } = readPublishedFixture(article.slug);
    concepts.push(buildMetadataConcept(article, metadata));
    concepts.push(buildArticleConcept(article, body));
  }
  return concepts;
}

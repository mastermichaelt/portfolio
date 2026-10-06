import fs from "node:fs";
import path from "node:path";

import {
  DEV_ARTICLE_URL,
  FIXTURE_FILES,
  FIXTURES_DIR,
  GENERATED_BY,
  SITE_URL,
} from "./constants.mjs";
import { parseSimpleFrontmatter, splitFrontmatter } from "./yaml.mjs";

const ARTICLE_SLUG = "evidence-driven-dependency-upgrades";

function stripHtmlComments(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildMetadataConcept(metadata) {
  const tagList = Array.isArray(metadata.tags)
    ? metadata.tags
    : metadata.tags
      ? [metadata.tags]
      : [];

  return {
    id: "writing/evidence-driven-dependency-upgrades-metadata",
    frontmatter: {
      type: "Published Article Metadata",
      title:
        metadata.title ?? "Upgrades don't have to be a blind trust exercise",
      resource: DEV_ARTICLE_URL,
      sources: [
        {
          id: "dev-article-4056883",
          title: metadata.title,
          resource: DEV_ARTICLE_URL,
        },
        {
          id: "portfolio-articles-index",
          title: "Portfolio articles index",
          resource: `${SITE_URL}/articles`,
        },
      ],
      generated: { by: GENERATED_BY },
      tags: ["evidence-driven-dependency-upgrades", "writing", "metadata"],
    },
    body: `Editorial hub metadata preserved from the pinned fixture frontmatter.

- Notion page: ${metadata.notion_page ?? "(not recorded)"}
- DEV article id: ${metadata.devto_article_id ?? "(not recorded)"}
- Last DEV sync: ${metadata.last_devto_sync ?? "(not recorded)"}
- Tags: ${tagList.join(", ") || "(none)"}
- Portfolio catalog: [Article catalog entry](/portfolio/evidence-driven-dependency-upgrades-catalog.md)
- Related project: [Renovate governance ladder](/portfolio/renovate-governance-case.md)

HTML comments from the fixture body are stripped in the narrative concept; editorial drafting notes are not part of OKF knowledge.`,
  };
}

function buildArticleConcept(body) {
  const cleaned = stripHtmlComments(body);
  return {
    id: "writing/evidence-driven-dependency-upgrades-article",
    frontmatter: {
      type: "Published Article",
      title: "Upgrades don't have to be a blind trust exercise",
      resource: DEV_ARTICLE_URL,
      sources: [
        {
          id: "dev-article-4056883",
          title: "Upgrades don't have to be a blind trust exercise",
          resource: DEV_ARTICLE_URL,
        },
      ],
      generated: { by: GENERATED_BY },
      tags: ["evidence-driven-dependency-upgrades", "writing", "field-report"],
    },
    body: `${cleaned}

---

Related runbook: [Renovate workflow overview](/repo/renovate-workflow-overview.md).`,
  };
}

/** Produce OKF concepts from the pinned DEV article fixture. */
export function produceDevConcepts(fixtureRoot = FIXTURES_DIR) {
  const fixturePath = path.join(
    fixtureRoot,
    FIXTURE_FILES.evidenceDrivenUpgrades,
  );
  const raw = fs.readFileSync(fixturePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) {
    throw new Error(`DEV fixture missing YAML frontmatter: ${ARTICLE_SLUG}`);
  }

  const metadata = parseSimpleFrontmatter(frontmatter);
  return [buildMetadataConcept(metadata), buildArticleConcept(body)];
}

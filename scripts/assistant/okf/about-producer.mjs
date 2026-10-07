import { about } from "../../../content/about.ts";

import { GENERATED_BY, SITE_URL } from "./constants.mjs";

const ABOUT_RESOURCE = `${SITE_URL}/about`;

function aboutSource() {
  return {
    id: "about-page",
    title: "About — career record",
    resource: ABOUT_RESOURCE,
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

/** Render one About experience or independent entry as OKF body text. */
export function aboutEntryBody(entry) {
  const orgPart = entry.org ? ` · ${entry.org}` : "";
  const header = `${entry.role}${orgPart} (${entry.dateRange})`;
  const parts = [header, ...entry.bullets, ...figureLines(entry.figures)];
  return parts.filter(Boolean).join("\n\n");
}

function buildSummaryConcept() {
  return {
    id: "about/summary",
    frontmatter: {
      type: "About Summary",
      title: "About — career summary",
      resource: ABOUT_RESOURCE,
      sources: [aboutSource()],
      generated: { by: GENERATED_BY },
      tags: ["about", "summary"],
    },
    body: about.summary.join("\n\n"),
  };
}

function buildEntryConcept(entry, sectionKind) {
  const type =
    sectionKind === "experience"
      ? "About Experience"
      : "About Independent Work";

  return {
    id: `about/${entry.id}`,
    frontmatter: {
      type,
      title: `${entry.role}${entry.org ? ` — ${entry.org}` : ""}`,
      resource: ABOUT_RESOURCE,
      sources: [aboutSource()],
      generated: { by: GENERATED_BY },
      tags: ["about", sectionKind, entry.id],
    },
    body: aboutEntryBody(entry),
  };
}

/** Produce OKF concepts from the About career-record page. */
export function produceAboutConcepts() {
  const concepts = [buildSummaryConcept()];

  for (const entry of about.experience.entries) {
    concepts.push(buildEntryConcept(entry, "experience"));
  }
  for (const entry of about.independent.entries) {
    concepts.push(buildEntryConcept(entry, "independent"));
  }

  return concepts;
}

import { projectCases } from "@/content/project-cases";
import type { CaseFigure, ProjectCase } from "@/domain/project-case";
import type { ProjectsIndex } from "@/domain/projects-index";

/**
 * Projects 1C index composition. Ordering and tiering are explicit here — not
 * derived from `Project.featured`. The two co-primary rows draw their index
 * figures straight from the linked case, so the "two figures per co-primary"
 * invariant and the exact strings stay aligned with the detail pages.
 */

const caseBySlug = new Map(projectCases.map((entry) => [entry.slug, entry]));

function caseFor(slug: string): ProjectCase {
  const found = caseBySlug.get(slug);
  if (!found) {
    throw new Error(`Projects index references unknown case slug: ${slug}`);
  }
  return found;
}

/** Exactly the figures a case marks for the index — value + name + scope intact. */
function indexFigures(slug: string): CaseFigure[] {
  return caseFor(slug)
    .blocks.flatMap((block) => block.figures ?? [])
    .filter((figure) => figure.onIndex);
}

const atlassian = caseFor("experiment-measurement");
const codenames = caseFor("codenames-ai");

export const projectsIndex: ProjectsIndex = {
  hero: {
    eyebrow: "Projects / evidence index",
    title: "Every system, and what it is allowed to claim.",
    lead: "Two case studies carry the argument: experiment measurement and attribution at Atlassian, and a production AI product operated since 2026. Four more systems show the method holding without a product attached. Each row states its contract and the evidence behind it.",
  },
  key: {
    label: "Index key",
    lines: [
      "Co-primary — written up at length, figures on this page",
      "Supporting — one line, proof surface linked",
      "Infrastructure — method, not a headline project",
    ],
  },
  columns: {
    system: "System / era",
    contract: "Contract",
    evidence: "Qualified evidence",
  },
  coPrimary: [
    {
      channelLabel: atlassian.channelLabel,
      title: atlassian.name,
      org: atlassian.metaLines[0]!,
      dateRange: atlassian.metaLines[1]!,
      href: `/projects/${atlassian.slug}`,
      contract: atlassian.title,
      summary:
        "Attribution windows and pipeline gaps silently change what an in-flight experiment appears to say. A Cross Flow funnel observability audit, an authored attribution formula adopted for Growth Experiment Impact Estimation, and embedded event-pipeline work restored attribution for experiments already running — preserving statistical validity without restarting them.",
      chips: [
        "Attribution audit",
        "Window reliability",
        "Event pipeline",
        "Acquisition onboarding",
        "Admin Hub",
      ],
      roleSpine:
        "Role spine — SSE 2019–2020 · EM 2020–2024, experiment operations for teams running cross-product experimentation, AIM platform concurrent · SSE 2024–2025",
      figures: indexFigures(atlassian.slug),
      deferral: [
        {
          text: "Five additional qualified figures on the case study (pipeline recovery, OKR attainment, Admin Hub activation). No field report is tagged to this work.",
        },
      ],
    },
    {
      channelLabel: codenames.channelLabel,
      title: codenames.name,
      org: codenames.metaLines[0]!,
      dateRange: codenames.metaLines[1]!,
      href: `/projects/${codenames.slug}`,
      contract: codenames.title,
      summary:
        "A model proposes a clue and nothing in the reply guarantees it is legal on this board. Schema-first structured outputs plus board-aware domain validators separate valid JSON from a legal move; model migrations run as controlled experiments with evaluation built into product behavior rather than left as an offline afterthought.",
      chips: [
        "Structured outputs",
        "Domain validators",
        "Model migrations",
        "Telemetry quality",
      ],
      roleSpine:
        "Operated end to end — React/TypeScript, Node.js/Express, OpenAI, deterministic validation, analytics instrumentation, CI/CD, multi-environment deployment",
      figures: indexFigures(codenames.slug),
      deferral: [
        { text: "codenames-ai.com →", href: "https://codenames-ai.com/" },
        { text: "  ·  3 field reports on the case study" },
      ],
    },
  ],
  supporting: [
    {
      title: "Editorial workflow",
      summary:
        "Human-in-the-loop weekly field reports — retrieval, critique and verification before publish, with irreversible publish steps held by a person.",
      proofSurface: "15 reports published via workflow · DEV series",
      href: "/projects/editorial-workflow",
    },
    {
      title: "Renovate governance",
      summary:
        "Classifier, investigator and maintainer with distinct write boundaries, overridable stop causes, and merge authority held away from the proposer.",
      proofSurface: "2 field reports · case study",
      href: "/projects/renovate-governance",
    },
    {
      title: "Agent-native systems",
      summary:
        "Team-harness plugin, cloud-hooks primitive and a four-layer hook stack — reusable workflows with explicit contracts and authority constraints.",
      proofSurface: "Ecosystem walkthrough →",
      href: "/ecosystem",
    },
  ],
  infrastructure: [
    {
      title: "Resume generator",
      summary:
        "Facts versus prose: applications select, reorder and rephrase; generation stops rather than invent a missing metric, title or employer.",
      proofSurface: "Private repository · no public URL",
    },
  ],
  footer: [
    { text: "Field reports on DEV hold the full archive — " },
    { text: "articles →", href: "/articles" },
    { text: "  ·  How these systems connect — " },
    { text: "ecosystem walkthrough →", href: "/ecosystem" },
  ],
};

import type { Homepage } from "@/domain/homepage";

/**
 * Homepage 2 content, transcribed from sibling `resumes/` inventory. Not
 * generate input; not a new project. Do not invent metrics or attach
 * `game_started` unless that event name is in the cited fact text.
 *
 * CH 02 routes to the `experiment-measurement` case study in
 * content/project-cases.ts. The `9%–41%` figure keeps its source meaning: it is
 * the spread in what an in-flight experiment reported across Statsig attribution
 * windows — the range is the measurement-reliability finding, not a delivery or
 * run-time outcome.
 */
export const homepage: Homepage = {
  hero: {
    title: "Making uncertain systems dependable.",
    lead: "Growth experimentation, attribution and platform measurement at Atlassian, 2014–2025. Independent AI products and agent-native engineering systems since 2026. The same practice in both:",
    leadEmphasis:
      "measure it, validate it, and write down what the system is allowed to do.",
  },
  method: [
    {
      ordinal: "01",
      key: "uncertain",
      label: "Uncertain",
      gloss: "What the system could not guarantee on its own.",
    },
    {
      ordinal: "02",
      key: "checkable",
      label: "Made checkable",
      gloss: "The mechanism built so something deterministic could decide.",
    },
    {
      ordinal: "03",
      key: "contract",
      label: "Contract",
      gloss: "What the system is now allowed to claim.",
    },
    {
      ordinal: "04",
      key: "evidence",
      label: "Qualified evidence",
      gloss: "One number, inseparable from the scope it was measured in.",
    },
  ],
  channels: [
    {
      id: "ch-01",
      channelLabel: "CH 01",
      title: "Codenames AI",
      meta: "Independent · 2026 – present · live product",
      href: "/projects/codenames-ai",
      caseStudyLabel: "Codenames AI case study →",
      spine: {
        uncertain:
          "A model proposes a clue. Nothing in the reply guarantees it is legal on this board.",
        checkable:
          "Schema-first structured outputs plus board-aware domain validators separate valid JSON from a legal move. Model migrations are treated as controlled experiments, with evaluation built into product behavior.",
        contract: "Valid JSON is not a legal move — the validator decides.",
      },
      figure: {
        value: "175+",
        name: "monthly active players",
        scope:
          "Live-product telemetry · resume phrasing uses 175+ as durable floor, not the rolling monthly-active-players snapshot",
        source: {
          inventory: "resumes/facts/codenames-ai-telemetry.yml",
          factId: "telemetry-model-experiments",
          metricId: "monthly-active-players",
        },
      },
    },
    {
      id: "ch-02",
      channelLabel: "CH 02",
      title: "Experiment measurement",
      meta: "Atlassian · Growth · 2020 – 2025",
      href: "/projects/experiment-measurement",
      caseStudyLabel: "Experiment measurement case study →",
      spine: {
        uncertain:
          "Attribution windows and pipeline gaps silently change what an in-flight experiment appears to say.",
        checkable:
          "A Cross Flow funnel observability audit and an authored attribution formula adopted for Growth Experiment Impact Estimation, plus embedded event-pipeline work that restored attribution for in-flight experiments.",
        contract:
          "Preserved statistical validity without restarting experiments.",
      },
      figure: {
        value: "9%–41%",
        name: "uplift variance across StatSig attribution windows",
        scope: "In-flight experiments · Statsig · the range is the finding",
        source: {
          inventory: "resumes/facts/statsig-reliability.yml",
          factId: "attribution-window-variance",
          metricId: "attribution-window-variance",
        },
      },
    },
  ],
  continuity: {
    label: "One practice",
    gloss: "Not a pivot — the same method, two decades.",
    claim:
      "Atlassian, 2014–2025 — Software Developer, Engineering Manager, Senior Software Engineer. Independent since 2026.",
    body: "Four of those years were spent managing, and the work was recognisably the same. The mechanisms each era left behind — attribution formulas, experiment-operations rules, checks that run at the point of change — are the ones running in the independent work now.",
    figure: {
      value: "8–10",
      name: "engineers directly managed",
      scope:
        "Atlassian Growth organization · through significant organizational and product change",
      source: {
        inventory: "resumes/facts/em-growth-delivery.yml",
        factId: "direct-reports",
        metricId: "direct-reports",
      },
    },
    link: { label: "Practice record, era by era →", href: "/about" },
  },
  routes: [
    {
      id: "projects",
      role: "Evidence index",
      name: "Projects →",
      href: "/projects",
      summary: "Every system, and what it is allowed to claim.",
    },
    {
      id: "articles",
      role: "Field reports",
      name: "Articles →",
      href: "/articles",
      summary: "15 weekly reports in five named lines of reasoning.",
    },
    {
      id: "about",
      role: "Practice record",
      name: "About →",
      href: "/about",
      summary: "One engineering practice, 2014 to now.",
    },
    {
      id: "ecosystem",
      role: "Walkthrough",
      name: "Ecosystem →",
      href: "/ecosystem",
      summary: "Four unrelated systems, the same five gates.",
    },
  ],
};

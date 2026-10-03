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
    title: "I follow the product requirement as deep as it needs to go.",
    lead: "Senior product engineer. I take ambiguous product problems from requirement to production, across the frontend, backend, data and AI layers needed to make them work. When the straightforward solution stops holding, I trace the problem into the underlying system and build the fix. Previously Atlassian Growth; now building independent AI products.",
  },
  method: [
    {
      ordinal: "01",
      key: "requirement",
      label: "Requirement",
      gloss: "What the product had to do, before any mechanism existed.",
    },
    {
      ordinal: "02",
      key: "depth",
      label: "Depth required",
      gloss:
        "The layer that had to be opened when the assumption underneath stopped holding.",
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
        requirement:
          "Players need an AI teammate whose every move is legal on this board, unsupervised, in a product that is live.",
        depth:
          "A model proposes a clue. Nothing in the reply guarantees it is legal on this board. Schema-first structured outputs plus board-aware domain validators separate valid JSON from a legal move. Model migrations are treated as controlled experiments, with evaluation built into product behavior.",
        contract: "Valid JSON is not a legal move — the validator decides.",
      },
      figure: {
        // Publish 175+ floor only — never the exact rolling MAU snapshot (175).
        value: "175+",
        name: "monthly active players",
        scope: "Codenames AI · live product telemetry",
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
        requirement:
          "Growth teams had to know whether a shipped change actually worked — including for an acquired product that was not on experimentation infrastructure yet.",
        depth:
          "Attribution windows and pipeline gaps silently change what an in-flight experiment appears to say. A Cross Flow funnel observability audit and an authored attribution formula adopted for Growth Experiment Impact Estimation, plus embedded event-pipeline work that restored attribution for in-flight experiments.",
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

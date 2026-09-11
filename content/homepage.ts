import type { Homepage } from "@/domain/homepage";

/**
 * Homepage-only presentation, transcribed from sibling `resumes/` inventory.
 * Not generate input; not a new project. Do not invent metrics or attach
 * `game_started` unless that event name is in the cited fact text.
 *
 * CH 02 is Atlassian experiment-measurement copy on this page only — there is
 * no `/projects/experiment-measurement` case study in this slice.
 */
export const homepage: Homepage = {
  hero: {
    title: "Making uncertain systems dependable.",
    lead: "Growth experimentation, attribution and platform measurement at Atlassian, 2014–2025. Independent AI products and agent-native engineering systems since 2026. The same practice in both:",
    leadEmphasis:
      "measure it, validate it, and write down what the system is allowed to do.",
  },
  channels: [
    {
      id: "ch-01",
      channelLabel: "CH 01",
      title: "Codenames AI",
      anchorLabel: "Codenames AI — live",
      href: "/projects/codenames-ai",
      dateRange: "2026 – present",
      thesis: "A production AI product where valid JSON is not a legal move.",
      spine: {
        uncertain:
          "A model proposes a clue. Nothing in the reply guarantees it is legal on this board.",
        checkable:
          "Schema-first structured outputs plus board-aware domain validators separate valid JSON from a legal move. Model migrations are treated as controlled experiments, with evaluation built into product behavior.",
        contract: "Valid JSON is not a legal move — the validator decides.",
      },
      figures: [
        {
          value: "175+",
          name: "monthly active players",
          scope:
            "Live-product telemetry · resume phrasing uses 175+ as durable floor, not the rolling monthly-active-players snapshot",
          source: {
            inventory: "resumes/facts/codenames-ai-telemetry.yml",
            factId: "telemetry-model-experiments",
          },
        },
        {
          value: "#1",
          name: "average position, branded search",
          scope: "Branded Google Search average position (last 28 days)",
          source: {
            inventory: "resumes/facts/codenames-ai-telemetry.yml",
            factId: "branded-search-discovery",
            metricId: "branded-search-position",
          },
        },
      ],
    },
    {
      id: "ch-02",
      channelLabel: "CH 02",
      title: "Experiment measurement",
      anchorLabel: "Experiment measurement — Atlassian",
      href: "#experiment-measurement",
      dateRange: "2020 – 2025",
      thesis:
        "Refuse a reported experiment number until attribution is checkable.",
      spine: {
        uncertain:
          "Attribution windows and pipeline gaps silently change what an in-flight experiment appears to say.",
        checkable:
          "A Cross Flow funnel observability audit and an authored attribution formula adopted for Growth Experiment Impact Estimation, plus embedded event-pipeline work that restored attribution for in-flight experiments.",
        contract:
          "Preserved statistical validity without restarting experiments.",
      },
      figures: [
        {
          value: ">10%",
          name: "prior-approach over-attribution exposed",
          scope:
            "Cross Flow funnel audit · formula subsequently adopted for Growth Experiment Impact Estimation",
          source: {
            inventory: "resumes/facts/cross-flow-experiment-measurement.yml",
            factId: "attribution-uplift",
            metricId: "attribution-uplift",
          },
        },
        {
          value: "9%–41%",
          name: "uplift variance across StatSig attribution windows",
          scope: "In-flight experiments · Statsig · the range is the finding",
          source: {
            inventory: "resumes/facts/statsig-reliability.yml",
            factId: "attribution-window-variance",
            metricId: "attribution-window-variance",
          },
        },
      ],
    },
  ],
  ledger: [
    {
      id: "independent-2026",
      dateRange: "2026 —",
      role: "Independent AI product engineer",
      detail:
        "Codenames AI in production; agent-native engineering systems with explicit workflow contracts.",
      current: true,
    },
    {
      id: "atlassian-sse-2024",
      dateRange: "2024 – 2025",
      role: "Senior Software Engineer, Growth",
      org: "Atlassian",
      detail:
        "Led cross-functional work to onboard Atlassian’s largest acquisition onto experimentation and growth infrastructure; exceeded associated business OKR targets by 10×.",
    },
    {
      id: "aim-program-lead",
      dateRange: "2022 – 2025",
      role: "Program Lead, Atlassians in Mentoring",
      org: "Atlassian · concurrent",
      detail:
        "Designed and built the engineering platform powering the program; scaled participation to 3,552 matched mentors and mentees, representing approximately 20% of Atlassians.",
    },
    {
      id: "atlassian-em-2020",
      dateRange: "2020 – 2024",
      role: "Engineering Manager, Growth",
      org: "Atlassian",
      detail:
        "Managed teams of 8–10 engineers through significant organizational and product change; established experiment-operations practices for Growth teams running cross-product experimentation.",
    },
    {
      id: "atlassian-sse-2019",
      dateRange: "2019 – 2020",
      role: "Senior Software Engineer, Growth",
      org: "Atlassian",
      detail:
        "Built Informed Pull Requests to surface security vulnerabilities in pull requests and automatically run accessibility and performance audits on SPAs.",
    },
    {
      id: "atlassian-swe-2015",
      dateRange: "2015 – 2019",
      role: "Software Developer",
      org: "Atlassian",
      detail:
        "Frontend and full-stack work across growth, billing, purchasing, onboarding, and experimentation-related systems, including cross-product initiatives involving Jira, Bitbucket, and Confluence.",
    },
    {
      id: "atlassian-graduate-2014",
      dateRange: "2014 – 2015",
      role: "Graduate Developer",
      org: "Atlassian",
      detail: "UNSW Co-op Program Scholar, Software Engineering (2009–2013).",
    },
  ],
  supporting: [
    {
      id: "renovate-governance",
      title: "Renovate governance ladder",
      href: "/projects/renovate-governance",
      summary:
        "Classifier, investigator and maintainer agents with distinct write boundaries, stop causes, and merge authority held away from the proposer.",
    },
    {
      id: "editorial-workflow",
      title: "AI-assisted editorial workflow",
      href: "/projects/editorial-workflow",
      summary:
        "Retrieval, drafting, critique, verification and a human-gated publish, operated at a weekly cadence.",
    },
    {
      id: "agent-native",
      title: "Agent-native engineering systems",
      href: "/ecosystem",
      summary:
        "Reusable workflows with explicit contracts, authority constraints, verification and evaluation, integrated with MCP-backed PostHog, GitHub and Notion.",
    },
  ],
  writing: [
    {
      slug: "active-players-which-sessions-counted",
      argument:
        "A healthy-looking Active players tile forced a sharper question about which sessions belonged in the metric.",
    },
    {
      slug: "agent-plans-authority-handoffs",
      argument:
        "Multi-slice agent plans need explicit authority handoffs and stop lines — not only implementation checklists.",
    },
    {
      slug: "ai-reviewer-kinds-of-reasoning",
      argument:
        "After fixing score-first critique, further reviewer gains came from separating kinds of reasoning rather than expanding the rubric.",
    },
  ],
};

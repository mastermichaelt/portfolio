import { profile } from "@/content/profile";
import type { AboutPage } from "@/domain/about";

/**
 * About "Standing Record" (2a) composition. Copy is transcribed from the
 * sibling `resumes/` inventory and the locked design handoff — do not invent
 * metrics. About signals continuity; Projects proves. Every figure reuses
 * `CaseFigure` (value + name + scope kept together) and carries a `source`
 * review aid that is never rendered.
 *
 * Evidence gate (resolved before ship): the Loom event-pipeline carry-forward
 * clause stays on 2024–2025 because `resumes/facts/loom-event-pipeline.yml`
 * declares `role: atlassian-senior-swe-2024`. If that role ever moves to the EM
 * period, move the clause to 2020–2024 and leave 2024–2025 with the
 * acquisition-onboarding mechanism.
 */
export const about: AboutPage = {
  eyebrow: "About · practice record",
  statement: "One engineering practice, 2014 to now.",
  lead: {
    text: "Growth experimentation, attribution and platform measurement at Atlassian, 2014–2025 — as an individual contributor, and for four of those years as an engineering manager. Independent AI products and agent-native engineering systems since 2026.",
    emphasis:
      "Each era left a specific mechanism behind, and the ones below are still in use.",
  },
  throughLine: [
    "The job has always been the same one under different names: find the number or the output that decides something, prove it can be reproduced, then write down what the system is allowed to claim. At Atlassian that meant funnel audits, attribution formulas, experiment windows and event pipelines. Independently it means schemas, domain validators and workflow contracts.",
    "The tools changed. The checks did not.",
  ],
  arc: [
    {
      id: "arc-2026",
      dateRange: "2026 —",
      role: "Independent AI product engineer",
      body: "Codenames AI in production, combining live-product telemetry with controlled model experiments; agent-native engineering systems with explicit workflow contracts; a weekly field report on what held.",
      carry: {
        label: "In force now",
        text: "schema-first structured outputs and board-aware domain validators; model migrations run as controlled experiments rather than swapped in place.",
      },
      current: true,
    },
    {
      id: "arc-2024",
      dateRange: "2024 – 2025",
      role: "Senior Software Engineer",
      org: "Growth · Atlassian",
      body: "Cross-functional growth engineering to onboard Atlassian's largest acquisition onto experimentation and growth infrastructure — acquisition onboarding, analytics pipelines, ML-backed surfaces.",
      carry: {
        label: "Carried forward",
        text: "the event-pipeline fix that restored attribution for experiments already running, instead of restarting them. Repairing telemetry without discarding the run is now the default posture.",
      },
    },
    {
      id: "arc-2020",
      dateRange: "2020 – 2024",
      role: "Engineering Manager",
      org: "Growth · Atlassian",
      body: "Managed teams of 8–10 engineers through significant organizational and product change, and established the experiment-operations practices used by Growth teams running cross-product experimentation. Concurrently, from 2022, the engineering platform behind Atlassians in Mentoring.",
      carry: {
        label: "Carried forward",
        text: "two mechanisms. The Cross Flow attribution formula, later adopted for Growth Experiment Impact Estimation. And the experiment-operations practice: written rules for what a team may launch, restart or report — the same artifact is now a workflow contract for agents.",
      },
    },
    {
      id: "arc-2019",
      dateRange: "2019 – 2020",
      role: "Senior Software Engineer",
      org: "Growth · Atlassian",
      body: "Experimentation initiatives, and Informed Pull Requests — surfacing security vulnerabilities in pull requests and running accessibility and performance audits on SPAs.",
      carry: {
        label: "Carried forward",
        text: "checks that run at the point of change, which is what the current hook stack does.",
      },
    },
    {
      id: "arc-2014",
      dateRange: "2014 – 2019",
      role: "Graduate then Software Developer · Atlassian",
      body: "Frontend and full-stack work across growth, billing, purchasing, onboarding and experimentation systems, including cross-product initiatives involving Jira, Bitbucket and Confluence. UNSW Co-op Program Scholar, Software Engineering, 2009–2013. The origin of the practice; the named mechanisms start above.",
    },
  ],
  arcEvidence: {
    label: "From the measurement era",
    figure: {
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
    ledgerNote: {
      lead: "Role-by-role detail — ",
      link: {
        label: "career ledger on the homepage →",
        href: "/#career-ledger",
      },
    },
  },
  management: {
    statement: "Management was this practice at team scale.",
    body: [
      "Four of these years were spent managing, and the work was recognisably the same: the operating practices for teams running cross-product experimentation, delivery held steady through organizational and product change, and — concurrently, 2022 to 2025 — the engineering platform behind Atlassians in Mentoring, which was built, not sponsored.",
      "The period ends in 2024 with a return to a Senior Software Engineer title, which is a change of title more than a change of method.",
      "One period inside a continuous practice, not a second career track.",
    ],
    figures: [
      {
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
      {
        value: "3,552",
        name: "matched mentors and mentees",
        scope: "Atlassians in Mentoring · approximately 20% of Atlassians",
        source: {
          inventory: "resumes/facts/aim-participation-scale.yml",
          factId: "matched-count",
          metricId: "matched-count",
        },
      },
    ],
  },
  current: {
    body: "Codenames AI is a production AI product where a reply that parses is not yet a legal move: schema-first structured outputs and board-aware domain validators decide legality, and model migrations run as controlled experiments with evaluation built into product behavior. Around it sit agent-native engineering systems — reusable workflows with explicit contracts, authority constraints and verification — and a weekly DEV field-report series.",
    mapLabel: "Same mechanism, current form",
    map: [
      { then: "Attribution formulas", now: "→ domain validators" },
      { then: "Experiment windows", now: "→ controlled model experiments" },
      {
        then: "Experiment-operations practice",
        now: "→ written workflow contracts",
      },
    ],
    figures: [
      {
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
    ],
    links: [
      { label: "Projects — evidence index →", href: "/projects" },
      { label: "Ecosystem walkthrough →", href: "/ecosystem" },
      {
        label: "Field reports on DEV →",
        href: profile.links.blog,
        external: true,
      },
    ],
  },
  surfaces: [
    {
      name: "This page",
      self: true,
      description:
        "Continuity — how the career developed into the current practice. Four qualified figures, one per era; enough to show it is one practice.",
    },
    {
      name: "Home",
      href: "/",
      description:
        "Positioning — the thesis, the two first-class systems, and the career ledger row by row.",
    },
    {
      name: "Projects",
      href: "/projects",
      description:
        "Evidence — attribution, window variance, pipeline recovery, OKR attainment, Admin Hub activation, each with its scope.",
    },
    {
      name: "Articles",
      href: "/articles",
      description:
        "Reasoning — weekly field reports on the calls made while building these systems.",
    },
    {
      name: "Résumé",
      description: "The full role-by-role record, on request.",
    },
  ],
  next: {
    label: "Next step",
    statement: "Open to senior engineering roles.",
    note: "Email is the fastest route; the record above is the reference.",
  },
};

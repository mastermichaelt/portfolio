import { articles } from "@/content/articles";
import type { ProjectCase } from "@/domain/project-case";

/**
 * Co-primary case studies for the Projects 1C experience. Copy is final,
 * transcribed verbatim from the design handoff detail references and the
 * evidence inventory. Figures keep value + name + scope together; a figure
 * whose scope will not fit is not shown. `CaseFigure.source` is a review aid,
 * never rendered.
 *
 * Field-report artifact rows resolve their title and URL from
 * `content/articles.ts` by `relatedProjectSlug`, so those links stay
 * single-source and drift is impossible.
 */

const articleBySlug = new Map(
  articles.map((article) => [article.slug, article]),
);

function article(slug: string) {
  const found = articleBySlug.get(slug);
  if (!found) {
    throw new Error(`Project case references unknown article slug: ${slug}`);
  }
  return found;
}

/** A resolved field-report artifact row naming the block it documents. */
function fieldReport(slug: string, documents: string) {
  const source = article(slug);
  return {
    id: `report-${slug}`,
    label: source.title,
    description: [{ text: documents }],
    href: source.url,
  };
}

const experimentMeasurement: ProjectCase = {
  slug: "experiment-measurement",
  name: "Experiment measurement",
  channelLabel: "CH 02",
  metaLines: ["Atlassian", "2020 – 2025", "Growth"],
  title: "Refuse a reported experiment number until attribution is checkable.",
  lead: "Attribution windows and pipeline gaps silently change what an in-flight experiment appears to say. Five blocks of evidence, each one an instance of the same move: name the uncertainty, build the check, write down the contract.",
  aside: {
    label: "Role spine",
    lines: [
      "Senior Software Engineer, Growth · 2024–2025",
      "Engineering Manager, Growth · 2020–2024",
      "Senior Software Engineer, Growth · 2019–2020",
    ],
    note: "The management period is experiment operations for teams running cross-product experimentation; the Atlassians in Mentoring platform was built concurrently.",
  },
  blocks: [
    {
      id: "b01",
      ordinal: "01",
      category: "Attribution",
      navLabel: "Attribution audit",
      heading:
        "Cross Flow reported an uplift the prior approach could not defend.",
      body: [
        "A funnel observability audit established where the prior approach over-attributed credit. The attribution formula authored from that audit was subsequently adopted for Growth Experiment Impact Estimation, so the correction outlived the experiment that prompted it.",
      ],
      contract:
        "an uplift is reportable once its attribution is reproducible by formula, not by the dashboard that happened to render it.",
      figures: [
        {
          value: ">10%",
          name: "prior-approach over-attribution exposed",
          scope:
            "Cross Flow funnel audit · formula subsequently adopted for Growth Experiment Impact Estimation",
          onIndex: true,
          source: {
            inventory: "resumes/facts/cross-flow-experiment-measurement.yml",
            factId: "attribution-uplift",
            metricId: "attribution-uplift",
          },
        },
      ],
    },
    {
      id: "b02",
      ordinal: "02",
      category: "Reliability",
      navLabel: "Window reliability",
      heading:
        "The same in-flight experiment said different things in different windows.",
      body: [
        "Analysis across StatSig attribution windows showed the reported uplift of experiments already running moving over a wide band. The range itself was the finding: no single window could be quoted as the result.",
      ],
      contract:
        "a result carries the window it was measured in, or it is not a result.",
      figures: [
        {
          value: "9%–41%",
          name: "uplift variance across StatSig attribution windows",
          scope: "In-flight experiments · Statsig · the range is the finding",
          onIndex: true,
          source: {
            inventory: "resumes/facts/statsig-reliability.yml",
            factId: "attribution-window-variance",
            metricId: "attribution-window-variance",
          },
        },
      ],
    },
    {
      id: "b03",
      ordinal: "03",
      category: "Pipeline",
      navLabel: "Event pipeline",
      heading:
        "The Loom event pipeline stopped attributing while experiments were still running.",
      body: [
        "Embedded event-pipeline work salvaged attribution mid-flight: lost Cross-flow experiment data was recovered, roughly half of paid-user events that would otherwise have been excluded were preserved, and experiments that had been blocked could continue.",
      ],
      contract:
        "statistical validity is preserved by repairing the pipeline, not by restarting the experiment.",
      figures: [
        {
          value: "20%",
          name: "lost Cross-flow experiment data recovered",
          scope: "Loom event pipeline · in-flight experiments",
          source: {
            inventory: "resumes/facts/loom-event-pipeline.yml",
            factId: "data-recovered",
          },
        },
        {
          value: "~50%",
          name: "paid-user events preserved",
          scope: "Loom event pipeline · attribution salvage",
          source: {
            inventory: "resumes/facts/loom-event-pipeline.yml",
            factId: "paid-user-events-preserved",
          },
        },
        {
          value: "5",
          name: "in-flight experiments unblocked",
          scope: "Loom event pipeline · experiments already running",
          source: {
            inventory: "resumes/facts/loom-event-pipeline.yml",
            factId: "experiments-unblocked",
          },
        },
      ],
    },
    {
      id: "b04",
      ordinal: "04",
      category: "Onboarding",
      navLabel: "Acquisition onboarding",
      heading:
        "An acquired product had to join the experimentation platform before it could be measured at all.",
      body: [
        "I led cross-functional work to onboard Atlassian’s largest acquisition onto experimentation and growth infrastructure — the prerequisite for any of the measurement work above applying to it.",
      ],
      contract:
        "a product is not part of the growth system until its events and attribution are on experimentation infrastructure.",
      figures: [
        {
          value: "10×",
          name: "exceeded associated business OKR targets",
          scope: "Acquisition onboarding scope · associated business OKR",
          source: {
            inventory: "resumes/facts/loom-acquisition.yml",
            factId: "okr-attainment",
          },
        },
      ],
    },
    {
      id: "b05",
      ordinal: "05",
      category: "Launch",
      navLabel: "Admin Hub experiments",
      heading:
        "Three Cross Flow experiments shipped in Admin Hub without an incident or a restart.",
      body: [
        "Admin Hub experimentation covered global Loom requests, run as three Cross Flow experiments launched with zero incidents and zero restarts — the operational half of the same discipline.",
      ],
      contract:
        "an experiment that has to be restarted has already lost its result.",
      figures: [
        {
          value: "35%",
          name: "D1D6AI increase",
          scope:
            "Admin Hub experimentation · three Cross Flow experiments · zero-incident, zero-restart launch",
          source: {
            inventory: "resumes/facts/admin-hub-experimentation.yml",
            factId: "d1d6ai-increase",
          },
        },
      ],
    },
  ],
  elsewhere: [
    { label: "Codenames AI →", href: "/projects/codenames-ai" },
    { label: "Field reports →", href: "/articles" },
    { label: "Ecosystem →", href: "/ecosystem" },
  ],
  artifacts: {
    label: "Artifacts and related writing",
    rows: [
      {
        id: "homepage-ch02",
        label: "Homepage channel CH 02",
        description: [
          {
            text: "The same thesis and two of these figures, stated as part of the home-page argument.",
          },
        ],
        href: "/#experiment-measurement",
      },
      {
        id: "no-public-artifact",
        label: "No public case-study artifact",
        labelMuted: true,
        description: [
          {
            text: "This work sits inside a private platform. Figures above cite the career inventory rather than a public URL.",
          },
        ],
        affordance: "Private",
      },
      {
        id: "adjacent-report",
        label: "No field report is tagged to this work",
        labelMuted: true,
        description: [
          {
            text: "The nearest published reasoning applies the same discipline — what the metric is allowed to count — on my own telemetry: ",
          },
          {
            text: `${article("active-players-which-sessions-counted").title} →`,
            href: article("active-players-which-sessions-counted").url,
          },
        ],
        affordance: "Adjacent",
      },
    ],
    closing: [
      { text: "Same method, live product — " },
      { text: "Codenames AI →", href: "/projects/codenames-ai" },
      { text: "  ·  All field reports — " },
      { text: "articles →", href: "/articles" },
    ],
  },
};

const codenamesAi: ProjectCase = {
  slug: "codenames-ai",
  name: "Codenames AI",
  channelLabel: "CH 01",
  metaLines: ["Independent", "2026 – present", "Live product"],
  title: "Valid JSON is not a legal move — the validator decides.",
  lead: "A production AI-assisted Codenames experience with structured LLM outputs, deterministic validation, model evaluation and product analytics. Four blocks of evidence, each one an instance of the same move: name the uncertainty, build the check, write down the contract.",
  aside: {
    label: "Scope",
    lines: [
      "React / TypeScript frontend",
      "Node.js / Express API",
      "OpenAI integrations",
      "Deterministic validation",
      "Analytics instrumentation",
      "CI/CD, multi-environment deploy",
    ],
    note: "Built and operated end to end across Vercel, Render and Cloudflare.",
  },
  blocks: [
    {
      id: "b01",
      ordinal: "01",
      category: "Validation",
      navLabel: "Legal-move validation",
      heading:
        "A model proposes a clue, and nothing in the reply guarantees it is legal on this board.",
      body: [
        "Well-formed JSON can still propose an illegal move, echo a clue back as a guess, or violate board membership. Schema-first structured outputs (Zod) plus board-aware domain validators separate the two questions, so failure is caught and recoverable rather than exposed to a player.",
      ],
      contract: "valid JSON is not a legal move — the validator decides.",
      note: {
        label: "Guardrails",
        lines: [
          "Structured output schema",
          "Board-membership validation",
          "Clue / guess separation",
          "Recoverable failure path",
        ],
        closing:
          "No figure is claimed for this block. The evidence is the validation contract and the published report on it.",
      },
    },
    {
      id: "b02",
      ordinal: "02",
      category: "Migrations",
      navLabel: "Model migrations",
      heading: "A model swap is an experiment, not an upgrade.",
      body: [
        "Model migrations across generations are treated as controlled experiments: live-product telemetry and contract checks surface compatibility failures before they become silent gameplay regressions. Evaluation is built into product behavior rather than left as an offline afterthought.",
      ],
      contract:
        "a migration ships when the contracts still hold under live traffic, not when the model is newer.",
      note: {
        label: "Complementary jobs",
        lines: [
          "Migration robustness — contract checks across model generations",
          "Live telemetry — model experiments observed in the running product",
        ],
        closing: "The two are not collapsed into one claim.",
      },
    },
    {
      id: "b03",
      ordinal: "03",
      category: "Telemetry",
      navLabel: "Telemetry quality",
      heading:
        "The activity number was only meaningful once the sessions behind it were defined.",
      body: [
        "Product analytics instrumentation makes the questions answerable: which sessions count, what a model experiment did to behavior, and where discovery comes from. The published figures below carry the same discipline as the Atlassian work — a durable floor is quoted, never the rolling snapshot.",
      ],
      contract:
        "a metric is publishable at the floor its definition can defend.",
      figures: [
        {
          value: "175+",
          name: "monthly active players",
          scope:
            "Live-product telemetry · resume phrasing uses 175+ as durable floor, not the rolling monthly-active-players snapshot",
          onIndex: true,
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
            factId: "branded-search-position",
          },
        },
      ],
    },
    {
      id: "b04",
      ordinal: "04",
      category: "Coverage",
      navLabel: "Domain coverage",
      heading:
        "Validation only holds if the domain it validates against is enumerated.",
      body: [
        "A language-aware projection pipeline backs the board with a canonical concept set, which is what makes board-membership checks decidable end to end rather than approximate.",
      ],
      contract:
        "the validator can only rule on a domain that has been written down.",
      figures: [
        {
          value: "350",
          name: "canonical English concepts",
          scope:
            "Language-aware projection pipeline · end-to-end domain coverage",
          onIndex: true,
          source: {
            inventory: "resumes/facts/codenames-ai-e2e.yml",
            factId: "canonical-concept-count",
          },
        },
      ],
    },
  ],
  elsewhere: [
    {
      label: "Experiment measurement →",
      href: "/projects/experiment-measurement",
    },
    { label: "Field reports →", href: "/articles" },
    { label: "Ecosystem →", href: "/ecosystem" },
  ],
  artifacts: {
    label: "Artifacts and related writing",
    rows: [
      {
        id: "live-product",
        label: "Live product — codenames-ai.com",
        description: [
          {
            text: "Solo mode asks an AI Spymaster for clues; in classic mode the AI guesses from clue and board state only.",
          },
        ],
        href: "https://codenames-ai.com/",
      },
      fieldReport(
        "schema-first-valid-json-wasnt-enough",
        "Field report — the validation contract in block 01.",
      ),
      fieldReport(
        "model-experiments-architectural-stress-test",
        "Field report — the migration discipline in block 02.",
      ),
      fieldReport(
        "active-players-which-sessions-counted",
        "Field report — the telemetry question in block 03.",
      ),
    ],
    closing: [
      {
        text: "Figures above are qualified engineering telemetry, not unaudited growth KPIs — the durable outcome is a production system with explicit validation contracts and publishable engineering lessons.  ·  Same method at Atlassian scale — ",
      },
      {
        text: "experiment measurement →",
        href: "/projects/experiment-measurement",
      },
    ],
  },
};

/** Index order is co-primary Atlassian first, then Codenames. */
export const projectCases: ProjectCase[] = [experimentMeasurement, codenamesAi];

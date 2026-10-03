import { profile } from "@/content/profile";
import type { AboutPage } from "@/domain/about";

/**
 * About career-record composition. Copy is transcribed from the October 2026
 * Senior Software Engineer résumé — do not invent metrics. Every figure reuses
 * `CaseFigure` (value + name + scope kept together) and carries a `source`
 * review aid that is never rendered.
 */
export const about: AboutPage = {
  eyebrow: "About · career record",
  statement:
    "Senior software engineer with 12+ years building production software.",
  summary: [
    "Senior software engineer with 12+ years of experience building production software, spanning full-stack product engineering, experimentation infrastructure, and technical leadership. Spent four years managing 8–10 engineers in Atlassian's Growth organisation before returning to a hands-on individual contributor role.",
    "Most recently building independent software projects and publishing technical writing, with a focus on AI products and developer infrastructure.",
  ],
  experience: {
    ordinal: "01",
    title: "Professional Experience · Atlassian",
    entries: [
      {
        id: "atlassian-swe-2024",
        dateRange: "May 2024 – Aug 2025",
        role: "Senior Software Engineer",
        org: "Atlassian",
        employmentType: "Full-time",
        bullets: [
          "Led cross-functional work to onboard Loom, Atlassian's largest acquisition, onto experimentation and growth infrastructure; exceeded associated business OKR targets by 10×.",
          "Coordinated embedded event pipeline work enabling experimentation for Loom and future acquisitions; restored MAU attribution for Embedded Experience integrations while preserving statistical validity without restarting experiments.",
          "Feature-led the Loom in Admin Hub Global Requests experiment as solo engineer, resolving Growth and Admin Hub architecture and API tradeoffs and enabling parallel experiment and Admin Hub API workstreams.",
        ],
        figures: [
          {
            value: "10×",
            name: "OKR attainment vs target",
            scope:
              "Loom acquisition onboarding · experimentation and growth infrastructure",
            source: {
              inventory: "resumes/facts/loom-acquisition.yml",
              factId: "okr-10x",
              metricId: "okr-attainment",
            },
          },
        ],
      },
      {
        id: "atlassian-em-2020",
        dateRange: "May 2020 – May 2024",
        role: "Engineering Manager",
        org: "Atlassian",
        employmentType: "Full-time",
        bullets: [
          "Managed teams of 8–10 engineers in Atlassian's Growth organization, leading delivery and cross-functional work across engineering, product, analytics, and design.",
          "Audited Cross Flow funnel observability and authored the attribution formula adopted for Growth Experiment Impact Estimation, exposing more than 10% over-attribution in the prior approach and prompting back-porting across earlier productionisation projects.",
        ],
        figures: [
          {
            value: "8–10",
            name: "engineers directly managed",
            scope:
              "Atlassian Growth organization · through significant organizational and product change",
            source: {
              inventory: "resumes/facts/em-growth-delivery.yml",
              factId: "org-change-leadership-concise",
              metricId: "direct-reports",
            },
          },
          {
            value: ">10%",
            name: "over-attribution in prior approach exposed",
            scope:
              "Cross Flow funnel audit · formula subsequently adopted for Growth Experiment Impact Estimation",
            source: {
              inventory: "resumes/facts/cross-flow-experiment-measurement.yml",
              factId: "attribution-formula-concise",
              metricId: "attribution-uplift",
            },
          },
        ],
      },
      {
        id: "atlassian-aim-2022",
        dateRange: "Mar 2022 – Aug 2025",
        role: "Program Lead",
        org: "Atlassians in Mentoring",
        employmentType: "Concurrent Program",
        employmentNote:
          "Concurrent with Engineering Manager and Senior Software Engineer roles at Atlassian.",
        bullets: [
          "Founding committee member of Atlassians in Mentoring (AIM), partnering with leaders in Program Management and Strategic Program & Operations to launch the initiative.",
          "Designed and built the engineering platform powering the program, serving as its sole Engineering Craft Champion from the first cohort onward.",
          "Scaled mentorship participation to 3,552 matched mentors and mentees, representing approximately 20% of Atlassians; contributed to 86% positive sentiment within Engineering and grew AIM into Atlassian's most-followed Atlas project among more than 60,000 company projects.",
        ],
        figures: [
          {
            value: "3,552",
            name: "matched mentors and mentees",
            scope: "Atlassians in Mentoring · approximately 20% of Atlassians",
            source: {
              inventory: "resumes/facts/aim-participation-scale.yml",
              factId: "participation-sentiment-atlas-concise",
              metricId: "matched-count",
            },
          },
          {
            value: "86%",
            name: "Engineering positive sentiment",
            scope:
              "Atlassians in Mentoring · most-followed Atlas project among more than 60,000 company projects",
            source: {
              inventory: "resumes/facts/aim-sentiment-atlas.yml",
              factId: "sentiment-atlas-concise",
              metricId: "sentiment-score",
            },
          },
        ],
      },
      {
        id: "atlassian-swe-2019",
        dateRange: "Feb 2019 – May 2020",
        role: "Senior Software Engineer",
        org: "Atlassian",
        employmentType: "Full-time",
        bullets: [
          "Built Informed Pull Requests to surface security vulnerabilities in pull requests, automatically run accessibility and performance audits on SPAs, and provide a foundation for statically deployed Storybooks.",
          "Led engineering initiatives across experimentation and growth-focused product surfaces within Atlassian's Growth organization.",
          "Facilitated technical enablement including Growth Reforge training sessions, recordings, onboarding materials, and knowledge-sharing.",
        ],
      },
      {
        id: "atlassian-swe-2015",
        dateRange: "Apr 2015 – Feb 2019",
        role: "Software Developer",
        org: "Atlassian",
        employmentType: "Full-time",
        bullets: [
          "Delivered frontend and full-stack engineering across growth, billing, purchasing, onboarding, and experimentation-related systems.",
          "Led and contributed to cross-product initiatives involving Jira, Bitbucket, Confluence, provisioning systems, and experimentation tooling; improved engineering quality and operational visibility through automated testing, feature flag consolidation, analytics integrations, and service refactoring.",
        ],
      },
    ],
  },
  independent: {
    ordinal: "02",
    title: "Independent Projects",
    entries: [
      {
        id: "codenames-ai",
        dateRange: "May 2026 – Present",
        role: "AI Product Engineering",
        org: "Codenames AI",
        current: true,
        bullets: [
          "Built and operated Codenames AI end to end as a production web product using React, TypeScript, Node.js, Express, and OpenAI, with validated model outputs, automated quality checks, and product analytics.",
          "Migrated production AI model integrations across generations, uncovering and resolving compatibility issues through automated checks and controlled rollout tests.",
          "Used live usage data from 175+ monthly active players to identify product, model-quality, and analytics gaps and guide subsequent improvements.",
          "Grew organic discovery to #1 average position for branded Google Search queries through technical SEO and product iteration.",
        ],
        figures: [
          {
            // Publish 175+ floor only — never the exact rolling MAU snapshot (175).
            value: "175+",
            name: "monthly active players",
            scope: "Codenames AI · live product telemetry",
            source: {
              inventory: "resumes/facts/codenames-ai-telemetry.yml",
              factId: "telemetry-model-experiments-plain",
              metricId: "monthly-active-players",
            },
          },
        ],
        links: [
          {
            label: "Codenames AI →",
            href: "https://codenames-ai.com",
            external: true,
          },
          { label: "Case study →", href: "/projects/codenames-ai" },
        ],
      },
      {
        id: "agent-infra",
        dateRange: "Jun 2026 – Present",
        role: "Agent Engineering & Developer Infrastructure",
        employmentType: "Supporting Project",
        bullets: [
          "Designed and operated a staged workflow for dependency updates with separate classify, investigate, and merge roles and clear ownership boundaries.",
          "Extracted and packaged reusable AI-assisted engineering workflows as portable Cursor plugins and developer tools, separating portable workflow logic from repository-owned configuration and policy.",
          "Built a durable learning-capture pipeline from activity observation through validated emit, quality checks, and optional cloud persistence.",
        ],
        links: [{ label: "Ecosystem walkthrough →", href: "/ecosystem" }],
      },
      {
        id: "field-reports",
        dateRange: "Jun 2026 – Present",
        role: "Engineering Research & Writing",
        employmentType: "Supporting Project",
        bullets: [
          "Published 18 weekly engineering field reports to 2,200+ DEV followers on building and operating AI products and engineering systems, earning DEV Trusted Member status.",
          "Designed and operated an AI-assisted writing workflow with retrieval, drafting, review, and human approval before publication.",
        ],
        figures: [
          {
            value: "18",
            name: "published field reports",
            scope: "Weekly AI Engineering Field Reports on DEV",
            source: {
              inventory: "resumes/facts/writing-field-reports.yml",
              factId: "series-overview-plain",
              metricId: "published-report-count",
            },
          },
          {
            value: "2,200+",
            name: "DEV followers",
            scope:
              "DEV Trusted Member · technical writing on AI products and engineering systems",
            source: {
              inventory: "resumes/facts/writing-field-reports.yml",
              factId: "series-overview-plain",
              metricId: "dev-followers",
            },
          },
        ],
        links: [
          {
            label: "Field reports on DEV →",
            href: profile.links.blog,
            external: true,
          },
          { label: "Articles →", href: "/articles" },
        ],
      },
    ],
  },
  skillsClusters: [
    {
      label: "Frontend",
      items: "JavaScript, TypeScript, React",
    },
    {
      label: "Platforms",
      items: "Node.js, Express, event pipelines, feature flags, messaging",
    },
    {
      label: "Experimentation and analytics",
      items: "A/B experimentation, Statsig, analytics instrumentation",
    },
    {
      label: "Leadership",
      items:
        "Technical leadership, hiring, mentoring, cross-functional delivery",
    },
    {
      label: "AI products",
      items:
        "OpenAI APIs, product analytics, AI-assisted development, production AI systems",
    },
  ],
  education: {
    institution: "University of New South Wales (UNSW)",
    degree: "Bachelor of Engineering (B.E.)",
    field: "Computer Software Engineering",
    dateRange: "2009 – 2013",
    honors: [
      "UNSW Co-op Program Scholar, Software Engineering (2009 – 2013)",
      "CSE Undergraduate Performance Prize (Year 4) — top 10 undergraduate computing students (2013)",
      "CSE Revue Producer — Hack to the Future (2011)",
    ],
  },
  workRights: {
    title: "Australian Citizen",
    detail: "Unrestricted Australian work rights",
  },
  next: {
    label: "Next step",
    statement: "Open to senior engineering roles.",
    note: "Email is the fastest route; the record above is the reference.",
  },
};

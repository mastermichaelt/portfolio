import type { Entity } from "@/domain/entities";
import type { Relationship } from "@/domain/relationships";
import type { WorkflowView } from "@/domain/workflow-view";

/**
 * Ecosystem inventory and curated workflow views.
 * Claims stay evidence-backed (portfolio projects + public DEV field reports).
 * Do not link private sibling-repo docs; readers cannot open them.
 * talkTrack is view-level presentation only — keep off Entity.
 */

export const entities: Entity[] = [
  {
    id: "project-codenames-ai",
    name: "Codenames AI",
    kind: "project",
    summary:
      "Production AI-assisted Codenames with structured LLM outputs, domain validation, and product analytics.",
    relatedProjectSlug: "codenames-ai",
    evidence: [
      {
        id: "ev-codenames-live",
        label: "Live product — codenames-ai.com",
        url: "https://codenames-ai.com/",
      },
    ],
  },
  {
    id: "project-editorial-workflow",
    name: "AI-assisted editorial workflow",
    kind: "project",
    summary:
      "Human-in-the-loop pipeline that turns engineering artifacts into weekly field reports.",
    relatedProjectSlug: "editorial-workflow",
    evidence: [
      {
        id: "ev-editorial-field-report",
        label: "DEV — The AI reviewer scored 23/25 and missed the point",
        url: "https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh",
      },
    ],
  },
  {
    id: "project-resume-generator",
    name: "Resume generator",
    kind: "project",
    summary:
      "Private facts→prose inventory: canonical evidence once, application overlays, deterministic generation.",
    relatedProjectSlug: "resume-generator",
  },
  {
    id: "project-renovate-governance",
    name: "Renovate governance ladder",
    kind: "project",
    summary:
      "Role-based agent workflow for dependency upgrades with stop causes and merge-authority boundaries.",
    relatedProjectSlug: "renovate-governance",
    evidence: [
      {
        id: "ev-renovate-field-report",
        label: "DEV — Upgrades don't have to be a blind trust exercise",
        url: "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj",
      },
    ],
  },
  {
    id: "workflow-renovate-ladder",
    name: "Renovate ladder workflow",
    kind: "workflow",
    summary:
      "Classify one active Renovate PR, route to investigation or maintainer, merge only when policy allows.",
    relatedProjectSlug: "renovate-governance",
  },
  {
    id: "workflow-editorial-pipeline",
    name: "Editorial field-report pipeline",
    kind: "workflow",
    summary:
      "Full skill chain: capture, triage, schedule, refresh, context, draft, critique, sync — humans own irreversible live publish.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "workflow-product-loop",
    name: "Product improvement loop",
    kind: "workflow",
    summary:
      "Codenames telemetry and analytics review feed field reports and product decisions.",
    relatedProjectSlug: "codenames-ai",
  },
  {
    id: "workflow-analytics-review",
    name: "Weekly analytics review",
    kind: "workflow",
    summary:
      "PostHog product-health review that turns telemetry into engineering write-ups and decisions.",
    relatedProjectSlug: "codenames-ai",
  },
  {
    id: "agent-renovate-classifier",
    name: "Renovate classifier",
    kind: "agent",
    summary:
      "Classifies one active (non-draft) Renovate PR into a YAML execution packet; never merges.",
    relatedProjectSlug: "renovate-governance",
  },
  {
    id: "agent-renovate-investigator",
    name: "Renovate investigator",
    kind: "agent",
    summary:
      "Gathers four-step evidence for investigation-eligible stops; no merge authority.",
    relatedProjectSlug: "renovate-governance",
  },
  {
    id: "agent-renovate-maintainer",
    name: "Renovate maintainer",
    kind: "agent",
    summary:
      "Re-verifies packet and policy evidence; may merge only when checks and policy allow.",
    relatedProjectSlug: "renovate-governance",
  },
  {
    id: "skill-editorial-inbox",
    name: "Editorial inbox skill",
    kind: "skill",
    summary:
      "Creates, enriches, and reclassifies Notion Inbox cards with grounded capture before triage.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-triage",
    name: "Editorial triage skill",
    kind: "skill",
    summary:
      "Scores Inbox cards, promotes a short Candidate set, and archives the weakest ideas.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-scheduler",
    name: "Editorial scheduler skill",
    kind: "skill",
    summary:
      "Ranks the Candidate pool and promotes exactly one card to Drafting for the weekly post.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-refresh",
    name: "Editorial refresh skill",
    kind: "skill",
    summary:
      "Optional freshness reassessment for a waiting Drafting card — append-only Refresh block, not a gate.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-context",
    name: "Editorial context skill",
    kind: "skill",
    summary:
      "Builds a bounded evidence packet from the Drafting card — retrieval only, no prose draft.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-draft",
    name: "Editorial draft skill",
    kind: "skill",
    summary:
      "Turns the Drafting card plus context packet into repo markdown under docs/dev.to/drafts.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-critique",
    name: "Editorial critique skill",
    kind: "skill",
    summary:
      "Adversarial draft critique that analyzes before it scores — separates judgment from QA checklists.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "skill-editorial-publish",
    name: "Editorial publish skill",
    kind: "skill",
    summary:
      "Syncs repo markdown to a DEV draft and updates Notion Draft URL — never auto-publishes live.",
    relatedProjectSlug: "editorial-workflow",
  },
  {
    id: "governance-merge-gates",
    name: "Merge authority gates",
    kind: "governance",
    summary:
      "Explicit stop causes, investigation lanes, and merge-commit-only execution boundaries.",
    relatedProjectSlug: "renovate-governance",
  },
  {
    id: "knowledge-career-inventory",
    name: "Career facts inventory",
    kind: "knowledge",
    summary:
      "Canonical facts/roles/meta layers that applications select from without inventing claims.",
    relatedProjectSlug: "resume-generator",
  },
  {
    id: "output-dev-field-reports",
    name: "DEV field reports",
    kind: "output",
    summary:
      "Public engineering field-report series on schema guardrails, evaluation, analytics, and agents.",
    evidence: [
      {
        id: "ev-devto",
        label: "DEV.to — @michaeltruong",
        url: "https://dev.to/michaeltruong",
      },
    ],
  },
  {
    id: "integration-posthog",
    name: "PostHog",
    kind: "integration",
    summary:
      "Product analytics instrumentation for Codenames and portfolio surfaces.",
    relatedProjectSlug: "codenames-ai",
  },
  {
    id: "integration-openai",
    name: "OpenAI",
    kind: "integration",
    summary:
      "Structured LLM outputs for Codenames clue/guess flows behind domain validators.",
    relatedProjectSlug: "codenames-ai",
  },
  {
    id: "integration-notion",
    name: "Notion",
    kind: "integration",
    summary:
      "Idea metadata and process boards for the editorial pipeline; repo owns article bodies.",
    relatedProjectSlug: "editorial-workflow",
  },
];

export const relationships: Relationship[] = [
  {
    id: "rel-codenames-uses-openai",
    fromId: "project-codenames-ai",
    toId: "integration-openai",
    type: "uses",
  },
  {
    id: "rel-codenames-uses-posthog",
    fromId: "project-codenames-ai",
    toId: "integration-posthog",
    type: "uses",
  },
  {
    id: "rel-codenames-feeds-product-loop",
    fromId: "project-codenames-ai",
    toId: "workflow-product-loop",
    type: "feeds",
  },
  {
    id: "rel-posthog-feeds-analytics",
    fromId: "integration-posthog",
    toId: "workflow-analytics-review",
    type: "feeds",
  },
  {
    id: "rel-analytics-feeds-field-reports",
    fromId: "workflow-analytics-review",
    toId: "output-dev-field-reports",
    type: "feeds",
  },
  {
    id: "rel-editorial-uses-notion",
    fromId: "project-editorial-workflow",
    toId: "integration-notion",
    type: "uses",
  },
  {
    id: "rel-editorial-produces-reports",
    fromId: "workflow-editorial-pipeline",
    toId: "output-dev-field-reports",
    type: "produces",
  },
  {
    id: "rel-editorial-uses-inbox",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-inbox",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-triage",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-triage",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-scheduler",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-scheduler",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-refresh",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-refresh",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-context",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-context",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-draft",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-draft",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-critique",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-critique",
    type: "uses",
  },
  {
    id: "rel-editorial-uses-publish",
    fromId: "workflow-editorial-pipeline",
    toId: "skill-editorial-publish",
    type: "uses",
  },
  {
    id: "rel-classifier-feeds-ladder",
    fromId: "agent-renovate-classifier",
    toId: "workflow-renovate-ladder",
    type: "feeds",
  },
  {
    id: "rel-gates-governs-maintainer",
    fromId: "governance-merge-gates",
    toId: "agent-renovate-maintainer",
    type: "governs",
  },
  {
    id: "rel-investigator-feeds-maintainer",
    fromId: "agent-renovate-investigator",
    toId: "agent-renovate-maintainer",
    type: "feeds",
    label: "after human audit",
  },
  {
    id: "rel-resume-uses-inventory",
    fromId: "project-resume-generator",
    toId: "knowledge-career-inventory",
    type: "uses",
  },
  {
    id: "rel-product-loop-feeds-reports",
    fromId: "workflow-product-loop",
    toId: "output-dev-field-reports",
    type: "feeds",
  },
];

export const workflowViews: WorkflowView[] = [
  {
    id: "system-overview",
    title: "System overview",
    summary:
      "Light orientation spine — how projects, AI workflows, governance/feedback, and evidence hang together. Not the full entity inventory.",
    talkTrack:
      "Orient here first: projects feed AI workflows, governance and feedback sit in the middle, and public evidence closes the loop. Then pick one operational canvas to walk through.",
    nodes: [
      {
        id: "layer-projects",
        label: "Projects",
        subtitle: "Shipped systems",
        kind: "project",
        position: { x: 0, y: 80 },
      },
      {
        id: "layer-workflows",
        label: "AI workflows",
        subtitle: "Operational loops",
        kind: "workflow",
        position: { x: 280, y: 80 },
      },
      {
        id: "layer-governance",
        label: "Governance & feedback",
        subtitle: "Gates and review",
        kind: "governance",
        position: { x: 560, y: 80 },
      },
      {
        id: "layer-evidence",
        label: "Evidence & outputs",
        subtitle: "Public artifacts",
        kind: "output",
        position: { x: 840, y: 80 },
        entityId: "output-dev-field-reports",
      },
    ],
    edges: [
      {
        id: "e-overview-1",
        source: "layer-projects",
        target: "layer-workflows",
      },
      {
        id: "e-overview-2",
        source: "layer-workflows",
        target: "layer-governance",
      },
      {
        id: "e-overview-3",
        source: "layer-governance",
        target: "layer-evidence",
      },
    ],
  },
  {
    id: "workflow-renovate",
    title: "Renovate governance ladder",
    summary:
      "Classify → investigate or maintainer path → merge gates. Walkthrough of the Codenames Renovate governance ladder.",
    talkTrack:
      "Walk Classify → Route → Investigate or Maintainer → Merge gates. The classifier emits a packet and never merges; the maintainer may merge only when policy and checks allow.",
    nodes: [
      {
        id: "node-classify",
        label: "Classify",
        subtitle: "One active PR → packet",
        kind: "agent",
        position: { x: 0, y: 160 },
        entityId: "agent-renovate-classifier",
        relatedProjectSlug: "renovate-governance",
      },
      {
        id: "node-route",
        label: "Route",
        subtitle: "Auto / investigate / stop",
        kind: "workflow",
        position: { x: 260, y: 160 },
        entityId: "workflow-renovate-ladder",
        relatedProjectSlug: "renovate-governance",
      },
      {
        id: "node-investigate",
        label: "Investigate",
        subtitle: "High-touch / unlisted",
        kind: "agent",
        position: { x: 560, y: 0 },
        entityId: "agent-renovate-investigator",
        relatedProjectSlug: "renovate-governance",
      },
      {
        id: "node-maintainer",
        label: "Maintainer",
        subtitle: "Re-verify + execute",
        kind: "agent",
        position: { x: 560, y: 320 },
        entityId: "agent-renovate-maintainer",
        relatedProjectSlug: "renovate-governance",
      },
      {
        id: "node-merge-gates",
        label: "Merge gates",
        subtitle: "Policy + CI + merge commit",
        kind: "governance",
        position: { x: 840, y: 160 },
        entityId: "governance-merge-gates",
        relatedProjectSlug: "renovate-governance",
      },
    ],
    edges: [
      { id: "e-reno-1", source: "node-classify", target: "node-route" },
      {
        id: "e-reno-2",
        source: "node-route",
        target: "node-investigate",
        label: "Investigate",
        sourceHandle: "out-top",
        targetHandle: "in",
      },
      {
        id: "e-reno-3",
        source: "node-route",
        target: "node-maintainer",
        label: "Auto path",
        sourceHandle: "out-bottom",
        targetHandle: "in",
      },
      {
        id: "e-reno-4",
        source: "node-investigate",
        target: "node-maintainer",
        label: "After audit",
        sourceHandle: "out-bottom",
        targetHandle: "in-top",
      },
      {
        id: "e-reno-5",
        source: "node-maintainer",
        target: "node-merge-gates",
        sourceHandle: "out",
        targetHandle: "in",
      },
    ],
  },
  {
    id: "workflow-editorial",
    title: "Editorial field-report pipeline",
    summary:
      "Capture → triage → schedule → refresh → context → draft → critique → sync → human publish. Full editorial skill chain.",
    talkTrack:
      "Walk the full operator skills: Capture grounds Notion Inbox cards; Triage promotes Candidates; Schedule picks one Drafting card; Refresh is optional freshness; Context gathers evidence before Draft; Critique analyzes before it scores; Sync only creates a DEV draft — humans own live publish.",
    nodes: [
      {
        id: "node-refresh",
        label: "Refresh",
        subtitle: "Optional freshness",
        kind: "skill",
        position: { x: 660, y: 0 },
        entityId: "skill-editorial-refresh",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-capture",
        label: "Capture",
        subtitle: "Create / enrich Inbox",
        kind: "skill",
        position: { x: 0, y: 160 },
        entityId: "skill-editorial-inbox",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-triage",
        label: "Triage",
        subtitle: "Inbox → Candidate",
        kind: "skill",
        position: { x: 220, y: 160 },
        entityId: "skill-editorial-triage",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-schedule",
        label: "Schedule",
        subtitle: "Candidate → Drafting",
        kind: "skill",
        position: { x: 440, y: 160 },
        entityId: "skill-editorial-scheduler",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-context",
        label: "Context",
        subtitle: "Bounded evidence packet",
        kind: "skill",
        position: { x: 880, y: 160 },
        entityId: "skill-editorial-context",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-draft",
        label: "Draft",
        subtitle: "Repo markdown body",
        kind: "skill",
        position: { x: 0, y: 360 },
        entityId: "skill-editorial-draft",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-critique",
        label: "Critique",
        subtitle: "Analyze before score",
        kind: "skill",
        position: { x: 260, y: 360 },
        entityId: "skill-editorial-critique",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-sync",
        label: "Sync",
        subtitle: "DEV draft only",
        kind: "skill",
        position: { x: 520, y: 360 },
        entityId: "skill-editorial-publish",
        relatedProjectSlug: "editorial-workflow",
      },
      {
        id: "node-publish",
        label: "Publish",
        subtitle: "Human-approved live post",
        kind: "output",
        position: { x: 780, y: 360 },
        entityId: "output-dev-field-reports",
        relatedProjectSlug: "editorial-workflow",
      },
    ],
    edges: [
      { id: "e-edit-1", source: "node-capture", target: "node-triage" },
      { id: "e-edit-2", source: "node-triage", target: "node-schedule" },
      {
        id: "e-edit-3",
        source: "node-schedule",
        target: "node-refresh",
        label: "Optional",
        sourceHandle: "out-top",
        targetHandle: "in-bottom",
      },
      {
        id: "e-edit-4",
        source: "node-refresh",
        target: "node-context",
        sourceHandle: "out",
        targetHandle: "in-top",
      },
      {
        id: "e-edit-5",
        source: "node-schedule",
        target: "node-context",
        label: "Skip",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "e-edit-6",
        source: "node-context",
        target: "node-draft",
        sourceHandle: "out-bottom",
        targetHandle: "in-top",
      },
      { id: "e-edit-7", source: "node-draft", target: "node-critique" },
      {
        id: "e-edit-8",
        source: "node-critique",
        target: "node-draft",
        label: "Revise",
        sourceHandle: "out-bottom",
        targetHandle: "in-bottom",
      },
      {
        id: "e-edit-9",
        source: "node-critique",
        target: "node-sync",
        label: "Ready",
      },
      {
        id: "e-edit-10",
        source: "node-sync",
        target: "node-publish",
        label: "Human",
      },
    ],
  },
  {
    id: "workflow-product-loop",
    title: "Product improvement loop",
    summary:
      "Codenames → PostHog → analytics review → DEV field reports → product decisions.",
    talkTrack:
      "Walk Codenames → PostHog → analytics review, then into DEV field reports and product decisions that feed back into the product.",
    nodes: [
      {
        id: "node-product",
        label: "Codenames AI",
        subtitle: "Live product",
        kind: "project",
        position: { x: 0, y: 140 },
        entityId: "project-codenames-ai",
        relatedProjectSlug: "codenames-ai",
      },
      {
        id: "node-telemetry",
        label: "PostHog",
        subtitle: "Product telemetry",
        kind: "integration",
        position: { x: 260, y: 140 },
        entityId: "integration-posthog",
        relatedProjectSlug: "codenames-ai",
      },
      {
        id: "node-review",
        label: "Analytics review",
        subtitle: "Weekly product health",
        kind: "workflow",
        position: { x: 520, y: 140 },
        entityId: "workflow-analytics-review",
        relatedProjectSlug: "codenames-ai",
      },
      {
        id: "node-reports",
        label: "DEV field reports",
        subtitle: "Public lessons",
        kind: "output",
        position: { x: 800, y: 0 },
        entityId: "output-dev-field-reports",
      },
      {
        id: "node-decisions",
        label: "Product decisions",
        subtitle: "Back into the product",
        kind: "workflow",
        position: { x: 800, y: 280 },
        entityId: "workflow-product-loop",
        relatedProjectSlug: "codenames-ai",
      },
    ],
    edges: [
      { id: "e-prod-1", source: "node-product", target: "node-telemetry" },
      { id: "e-prod-2", source: "node-telemetry", target: "node-review" },
      {
        id: "e-prod-3",
        source: "node-review",
        target: "node-reports",
        sourceHandle: "out-top",
        targetHandle: "in",
      },
      {
        id: "e-prod-4",
        source: "node-review",
        target: "node-decisions",
        sourceHandle: "out-bottom",
        targetHandle: "in",
      },
      {
        id: "e-prod-5",
        source: "node-decisions",
        target: "node-product",
        label: "Ship",
        sourceHandle: "out-bottom",
        targetHandle: "in-bottom",
      },
    ],
  },
];

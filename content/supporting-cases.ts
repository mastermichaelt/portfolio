import type { SupportingCase } from "@/domain/supporting-case";

/**
 * Supporting-tier case studies for /projects/editorial-workflow and
 * /projects/renovate-governance. Narrative copy is the prose these two projects
 * carried in content/projects.ts, verbatim; splitting a section into lead, body
 * and contract is placement only. A contract line appears only where the
 * section's own copy already states a rule (Editorial one, Renovate two).
 * Neither case carries a qualified figure.
 *
 * `supportingCaseSourceProse` is a non-rendered review aid: the original,
 * unsplit section body for each prose block, so a test can prove every lead,
 * body and contract line is a verbatim substring of the source.
 */

/** Keyed `${slug}:${blockId}` → the original, unsplit section body. */
export const supportingCaseSourceProse: Record<string, string> = {
  "editorial-workflow:b01":
    "Publishing thoughtful engineering writing every week is less about pressing a publish button and more about keeping voice, evidence, and judgment intact while agents help with capture, drafting, and critique. A longer style rule did not stabilize voice; score-first review produced QA feedback when the draft needed editorial judgment.",
  "editorial-workflow:b02":
    "I designed and built the AI-assisted editorial workflows — planning, retrieval, drafting, critique, verification, and publication — as reusable role-based skills with explicit contracts, while developing production software and publishing the field-report series they produce.",
  "editorial-workflow:b03":
    "Ideas live as Notion cards; article bodies live as repo markdown; DEV.to is the publish surface. Operator skills cover the lifecycle Inbox → Candidate → Drafting → Published: capture/triage, weekly schedule (one Drafting card at a time), bounded context retrieval, draft generation, adversarial critique, and draft sync — with humans editing markdown and approving irreversible publish steps.",
  "editorial-workflow:b05":
    "Ownership is explicit: Notion wins for idea metadata, the repo wins for article body, DEV.to wins for the live post, and skill files win for agent behavior. Humans remain in the loop for revision and final publish. Cover-image review is an explicit gate after a post shipped without one. Cadence defaults to one thoughtful DEV post per week.",
  "editorial-workflow:b06":
    "Retrieval, generation, and critique are separate stages rather than one prompt. Critique analyzes before it scores. Voice training prefers a strong structural exemplar over an ever-growing style encyclopedia. MCP-backed Notion and GitHub integrations supply grounded context without letting agents silently rewrite the source of truth.",
  "editorial-workflow:b07":
    "The system continuously produces a public weekly engineering field-report series on DEV — covering agents, LLMs, evaluation, analytics, and AI-assisted engineering practices from production software workflows — through structured context retrieval, critique, and evidence-based refinement rather than one-off chatbot drafting.",
  "renovate-governance:b01":
    "Open Renovate PRs are handled through a manual four-step ladder: classify one active (non-draft) PR per run into a YAML execution packet; route to maintainer auto-path, investigation, or hard stop; optionally investigate high-touch/unlisted packages; then execute only when policy and CI allow. Draft Renovate PRs stay parked until marked ready — they are reported in discovery but not selectable by the ladder.",
  "renovate-governance:b03":
    "I designed and built the role-based AI engineering workflows — planning, review, verification, investigation, and publishing — with reusable contracts, authority constraints, and evaluation while developing production software. The Renovate ladder is one operationalization of that pattern: classifier, investigator, and maintainer agents with distinct write boundaries.",
  "renovate-governance:b04":
    "Merge authority is gated: the classifier never merges; the investigator has no merge authority and never passes --approved; the maintainer may merge only when packet shape, policy version, head SHA, and required checks allow — merge commits only. Investigation-approved execution remains restricted to dependency-only allowed paths. Hard stops and deferrals are first-class outcomes, not failures of the workflow.",
  "renovate-governance:b05":
    "Operators run /renovate-classifier (or /renovate-loop for batch), route by packet, and for investigation-eligible stops run the investigator, human-audit the report, then invoke /renovate-maintainer --approved. Each maintainer run writes a gitignored audit report. Phase 6 automation triggers (schedules/webhooks) are deferred until the manual path is routine.",
  "renovate-governance:b06":
    "Plans and packets must name where agents stop — not only what to build. Authority handoffs, overridable stop_causes, and draft-parking for ecosystem majors keep automation from outrunning human judgment. Evidence-driven upgrade investigation replaces blind trust in green CI alone.",
};

const editorialWorkflow: SupportingCase = {
  slug: "editorial-workflow",
  name: "AI-assisted editorial workflow",
  header: {
    tier: "Supporting",
    lines: [
      "Workflow case study",
      "agents · workflows · writing",
      "evaluation · Notion",
    ],
  },
  title: "AI-assisted editorial workflow",
  lead: "A human-in-the-loop editorial system that turns engineering artifacts into weekly field reports through planning, retrieval, drafting, critique, verification, and publication.",
  aside: {
    label: "Source of truth",
    lines: [
      "Notion — idea metadata",
      "Repo — article body",
      "DEV.to — live post",
      "Skill files — agent behavior",
    ],
    note: "Humans remain in the loop for revision and final publish.",
  },
  blocks: [
    {
      type: "prose",
      id: "b01",
      ordinal: "01",
      category: "Problem",
      navLabel: "Problem",
      lead: "Publishing thoughtful engineering writing every week is less about pressing a publish button and more about keeping voice, evidence, and judgment intact while agents help with capture, drafting, and critique.",
      body: [
        "A longer style rule did not stabilize voice; score-first review produced QA feedback when the draft needed editorial judgment.",
      ],
    },
    {
      type: "prose",
      id: "b02",
      ordinal: "02",
      category: "Contribution",
      navLabel: "Contribution",
      lead: "I designed and built the AI-assisted editorial workflows — planning, retrieval, drafting, critique, verification, and publication — as reusable role-based skills with explicit contracts, while developing production software and publishing the field-report series they produce.",
      body: [],
    },
    {
      type: "prose",
      id: "b03",
      ordinal: "03",
      category: "System",
      navLabel: "System",
      lead: "Ideas live as Notion cards; article bodies live as repo markdown; DEV.to is the publish surface.",
      body: [
        "Operator skills cover the lifecycle Inbox → Candidate → Drafting → Published: capture/triage, weekly schedule (one Drafting card at a time), bounded context retrieval, draft generation, adversarial critique, and draft sync — with humans editing markdown and approving irreversible publish steps.",
      ],
      note: {
        label: "Lifecycle",
        lines: [
          "Inbox → Candidate",
          "Candidate → Drafting",
          "Drafting → Published",
        ],
        closing: "One Drafting card at a time.",
      },
    },
    {
      type: "architecture",
      id: "b04",
      ordinal: "04",
      category: "Architecture",
      navLabel: "Architecture",
      provenance: "migrated from /ecosystem",
      defaultSub: "Eight operator skills and one public output",
      defaultSummary:
        "Each node owns one contract in the chain. Select one to read its summary and evidence; press it again, or click the canvas, to close.",
      legendKinds: "skill — operator skill · output — public artifact",
    },
    {
      type: "prose",
      id: "b05",
      ordinal: "05",
      category: "Constraints",
      navLabel: "Constraints",
      lead: "Ownership is explicit: Notion wins for idea metadata, the repo wins for article body, DEV.to wins for the live post, and skill files win for agent behavior.",
      body: [
        "Cover-image review is an explicit gate after a post shipped without one. Cadence defaults to one thoughtful DEV post per week.",
      ],
      contract: "Humans remain in the loop for revision and final publish.",
      note: {
        label: "Explicit gates",
        lines: ["Cover-image review", "Human revision", "Final publish"],
        closing: "No editorial KPI is claimed on this page.",
      },
    },
    {
      type: "prose",
      id: "b06",
      ordinal: "06",
      category: "Decisions",
      navLabel: "Decisions",
      lead: "Retrieval, generation, and critique are separate stages rather than one prompt.",
      body: [
        "Critique analyzes before it scores. Voice training prefers a strong structural exemplar over an ever-growing style encyclopedia. MCP-backed Notion and GitHub integrations supply grounded context without letting agents silently rewrite the source of truth.",
      ],
    },
    {
      type: "prose",
      id: "b07",
      ordinal: "07",
      category: "Outcomes",
      navLabel: "Outcomes",
      lead: "The system continuously produces a public weekly engineering field-report series on DEV — covering agents, LLMs, evaluation, analytics, and AI-assisted engineering practices from production software workflows — through structured context retrieval, critique, and evidence-based refinement rather than one-off chatbot drafting.",
      body: [],
    },
  ],
  elsewhere: [
    { label: "Renovate governance →", href: "/projects/renovate-governance" },
    { label: "Codenames AI →", href: "/projects/codenames-ai" },
    { label: "Field reports →", href: "/articles" },
  ],
  artifacts: {
    label: "Artifacts and related writing",
    rows: [
      {
        id: "devto-series",
        label: "DEV.to field reports",
        description: [{ text: "The published series this pipeline produces." }],
        href: "https://dev.to/michaeltruong",
      },
      {
        id: "report-one-example",
        label: "One good example beat every AI writing rule I wrote",
        description: [
          { text: "Field report — the voice-training decision in block 06." },
        ],
        href: "https://dev.to/michaeltruong/one-good-example-beat-every-ai-writing-rule-i-wrote-7oo",
      },
      {
        id: "report-reviewer-scored",
        label: "The AI reviewer scored 23/25 and missed the point",
        description: [
          { text: "Field report — the critique stage in block 04." },
        ],
        href: "https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh",
      },
      {
        id: "report-wrong-problem",
        label: "I fixed my AI reviewer. Then I kept solving the wrong problem",
        description: [
          {
            text: "Field report — the reasoning behind the critique contract.",
          },
        ],
        href: "https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-58am",
      },
    ],
    closing: [
      {
        text: "Public field reports linked above. Prefer those artifacts over invented editorial KPIs.  ·  Governance built on the same role-based pattern — ",
      },
      {
        text: "Renovate governance ladder →",
        href: "/projects/renovate-governance",
      },
    ],
  },
};

const renovateGovernance: SupportingCase = {
  slug: "renovate-governance",
  name: "Renovate governance ladder",
  header: {
    tier: "Supporting",
    lines: [
      "Operational system",
      "agents · governance",
      "dependencies · workflows",
    ],
  },
  title: "Renovate governance ladder",
  lead: "A role-based agent workflow for dependency upgrades with explicit contracts, stop causes, investigation lanes, and merge-authority boundaries.",
  aside: {
    label: "Merge authority",
    lines: [
      "Classifier — never merges",
      "Investigator — no merge authority",
      "Maintainer — merges only when policy and checks allow",
    ],
    note: "Phase 6 automation triggers (schedules/webhooks) are deferred until the manual path is routine.",
  },
  blocks: [
    {
      type: "prose",
      id: "b01",
      ordinal: "01",
      category: "System",
      navLabel: "System",
      lead: "Open Renovate PRs are handled through a manual four-step ladder: classify one active (non-draft) PR per run into a YAML execution packet; route to maintainer auto-path, investigation, or hard stop; optionally investigate high-touch/unlisted packages; then execute only when policy and CI allow.",
      body: [
        "Draft Renovate PRs stay parked until marked ready — they are reported in discovery but not selectable by the ladder.",
      ],
    },
    {
      type: "architecture",
      id: "b02",
      ordinal: "02",
      category: "Architecture",
      navLabel: "Architecture",
      provenance: "migrated from /ecosystem",
      defaultSub: "Three agents, one routing step, one governance gate",
      defaultSummary:
        "Each node owns one write boundary in the ladder. Select one to read its summary and evidence; press it again, or click the canvas, to close.",
      legendKinds:
        "agent · workflow · governance — write boundaries differ by kind",
    },
    {
      type: "prose",
      id: "b03",
      ordinal: "03",
      category: "Contribution",
      navLabel: "Contribution",
      lead: "I designed and built the role-based AI engineering workflows — planning, review, verification, investigation, and publishing — with reusable contracts, authority constraints, and evaluation while developing production software.",
      body: [
        "The Renovate ladder is one operationalization of that pattern: classifier, investigator, and maintainer agents with distinct write boundaries.",
      ],
    },
    {
      type: "prose",
      id: "b04",
      ordinal: "04",
      category: "Constraints",
      navLabel: "Constraints",
      lead: "Merge authority is gated: the classifier never merges; the investigator has no merge authority and never passes --approved; the maintainer may merge only when packet shape, policy version, head SHA, and required checks allow — merge commits only.",
      body: [
        "Investigation-approved execution remains restricted to dependency-only allowed paths.",
      ],
      contract:
        "Hard stops and deferrals are first-class outcomes, not failures of the workflow.",
      note: {
        label: "Merge gates",
        lines: [
          "Packet shape",
          "Policy version",
          "Head SHA",
          "Required checks",
        ],
        closing: "Merge commits only.",
      },
    },
    {
      type: "prose",
      id: "b05",
      ordinal: "05",
      category: "Operation",
      navLabel: "Operation",
      lead: "Operators run /renovate-classifier (or /renovate-loop for batch), route by packet, and for investigation-eligible stops run the investigator, human-audit the report, then invoke /renovate-maintainer --approved.",
      body: ["Each maintainer run writes a gitignored audit report."],
      note: {
        label: "Run order",
        lines: [
          "/renovate-classifier",
          "route by packet",
          "investigator + human audit",
          "/renovate-maintainer --approved",
        ],
        closing: "Automation triggers deferred to Phase 6.",
      },
    },
    {
      type: "prose",
      id: "b06",
      ordinal: "06",
      category: "Decisions",
      navLabel: "Decisions",
      lead: "Plans and packets must name where agents stop — not only what to build.",
      body: [
        "Authority handoffs, overridable stop_causes, and draft-parking for ecosystem majors keep automation from outrunning human judgment.",
      ],
      contract:
        "Evidence-driven upgrade investigation replaces blind trust in green CI alone.",
    },
  ],
  elsewhere: [
    { label: "Editorial workflow →", href: "/projects/editorial-workflow" },
    { label: "Codenames AI →", href: "/projects/codenames-ai" },
    { label: "Field reports →", href: "/articles" },
  ],
  artifacts: {
    label: "Artifacts and related writing",
    rows: [
      {
        id: "report-upgrades",
        label: "Upgrades don't have to be a blind trust exercise",
        description: [
          { text: "Field report — the investigation lane in block 04." },
        ],
        href: "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj",
      },
      {
        id: "report-where-to-stop",
        label: "The agent plan had every step except where to stop",
        description: [
          { text: "Field report — the authority handoffs in block 06." },
        ],
        href: "https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h",
      },
      {
        id: "audit-reports",
        label: "Audit reports are gitignored",
        labelMuted: true,
        description: [
          {
            text: "Each maintainer run writes one locally; no public artifact.",
          },
        ],
        affordance: "Private",
      },
    ],
    closing: [
      {
        text: "Public field reports above. No invented maintenance KPIs — the system's value is explicit stop conditions and auditability.  ·  The same role-based pattern, editorial lane — ",
      },
      {
        text: "AI-assisted editorial workflow →",
        href: "/projects/editorial-workflow",
      },
    ],
  },
};

/** Index order mirrors the projects-index supporting tier: Editorial, then Renovate. */
export const supportingCases: SupportingCase[] = [
  editorialWorkflow,
  renovateGovernance,
];

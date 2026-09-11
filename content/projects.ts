import type { Project } from "@/domain/project";

/**
 * Generic project inventory (supporting + infrastructure tiers) rendered by the
 * `/projects/[slug]` case-study template. The two co-primary case studies —
 * `experiment-measurement` and `codenames-ai` — live in `content/project-cases.ts`
 * as a richer 1C presentation model and are not duplicated here.
 *
 * Transcribed from sibling workspace evidence (`resumes/*`, `codenames-ai-guesser`
 * docs/README). Manual copy only. Section kinds are chosen after evidence audit —
 * unsupported kinds omitted.
 */
export const projects: Project[] = [
  {
    slug: "editorial-workflow",
    title: "AI-assisted editorial workflow",
    summary:
      "A human-in-the-loop editorial system that turns engineering artifacts into weekly field reports through planning, retrieval, drafting, critique, verification, and publication.",
    tags: ["agents", "workflows", "writing", "evaluation", "Notion"],
    eyebrow: "Workflow case study",
    kind: "workflow",
    sections: [
      {
        id: "problem",
        kind: "problem",
        title: "Problem",
        body: "Publishing thoughtful engineering writing every week is less about pressing a publish button and more about keeping voice, evidence, and judgment intact while agents help with capture, drafting, and critique. A longer style rule did not stabilize voice; score-first review produced QA feedback when the draft needed editorial judgment.",
      },
      {
        id: "role",
        kind: "role",
        title: "Contribution",
        body: "I designed and built the AI-assisted editorial workflows — planning, retrieval, drafting, critique, verification, and publication — as reusable role-based skills with explicit contracts, while developing production software and publishing the field-report series they produce.",
      },
      {
        id: "system",
        kind: "system",
        title: "System",
        body: "Ideas live as Notion cards; article bodies live as repo markdown; DEV.to is the publish surface. Operator skills cover the lifecycle Inbox → Candidate → Drafting → Published: capture/triage, weekly schedule (one Drafting card at a time), bounded context retrieval, draft generation, adversarial critique, and draft sync — with humans editing markdown and approving irreversible publish steps.",
      },
      {
        id: "constraints",
        kind: "constraints",
        title: "Constraints",
        body: "Ownership is explicit: Notion wins for idea metadata, the repo wins for article body, DEV.to wins for the live post, and skill files win for agent behavior. Humans remain in the loop for revision and final publish. Cover-image review is an explicit gate after a post shipped without one. Cadence defaults to one thoughtful DEV post per week.",
      },
      {
        id: "decisions",
        kind: "decisions",
        title: "Decisions",
        body: "Retrieval, generation, and critique are separate stages rather than one prompt. Critique analyzes before it scores. Voice training prefers a strong structural exemplar over an ever-growing style encyclopedia. MCP-backed Notion and GitHub integrations supply grounded context without letting agents silently rewrite the source of truth.",
      },
      {
        id: "outcomes",
        kind: "outcomes",
        title: "Outcomes",
        body: "The system continuously produces a public weekly engineering field-report series on DEV — covering agents, LLMs, evaluation, analytics, and AI-assisted engineering practices from production software workflows — through structured context retrieval, critique, and evidence-based refinement rather than one-off chatbot drafting.",
      },
      {
        id: "evidence",
        kind: "evidence",
        title: "Evidence",
        body: "Public field reports linked below. Prefer those artifacts over invented editorial KPIs.",
      },
    ],
    relatedLinks: [
      {
        id: "devto-blog",
        label: "DEV.to field reports",
        url: "https://dev.to/michaeltruong",
      },
      {
        id: "editorial-reviewer-article",
        label: "The AI reviewer scored 23/25 and missed the point",
        url: "https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh",
      },
    ],
    evidence: [
      {
        id: "article-one-example",
        label: "One good example beat every AI writing rule I wrote",
        url: "https://dev.to/michaeltruong/one-good-example-beat-every-ai-writing-rule-i-wrote-7oo",
      },
      {
        id: "article-reviewers-scoring",
        label: "The AI reviewer scored 23/25 and missed the point",
        url: "https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh",
      },
      {
        id: "article-reviewer-reasoning",
        label: "I fixed my AI reviewer. Then I kept solving the wrong problem",
        url: "https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-58am",
      },
    ],
  },
  {
    slug: "resume-generator",
    title: "Resume generator",
    summary:
      "A private facts→prose career inventory: canonical evidence once, application overlays for selection and tone, and deterministic document generation that refuses to invent claims.",
    tags: [
      "knowledge-modeling",
      "TypeScript",
      "generation",
      "ATS",
      "architecture",
    ],
    eyebrow: "Meta-infrastructure",
    kind: "infrastructure",
    sections: [
      {
        id: "problem",
        kind: "problem",
        title: "Problem",
        body: "Tailored resumes and recruiter replies usually drift into copy-paste fiction: each application rewrites bullets until the strongest claims no longer match any shared source of truth. The hard problem is not “generate a PDF” — it is keeping every channel grounded in the same evidence while still allowing page-aware selection and company-specific emphasis.",
      },
      {
        id: "role",
        kind: "role",
        title: "Contribution",
        body: "I designed and built a private inventory repository that separates career facts from application prose, with typed generate/PDF tooling, theme presentation, ATS and theme-render checks, and agent rules that stop rather than invent missing metrics, titles, or employers.",
      },
      {
        id: "system",
        kind: "system",
        title: "System",
        body: "Canonical layers live under facts/, roles/, and meta/. Each application supplies brief.yml and include.yml to select, reorder, and tone — never to invent claims. research.md holds human notes that must not enter generate inputs. Derived Markdown/PDF under applications/<slug>/out/ is generated only. Themes (ats, modern-two-column) own presentation via Handlebars and theme.yml; day-one channels are 1- and 2-page resumes plus recruiter reply from the same inventory.",
      },
      {
        id: "constraints",
        kind: "constraints",
        title: "Constraints",
        body: "Facts vs prose is enforced: applications only select, reorder, and rephrase. Controlled rephrasing must not strengthen causality, ownership, scale, or certainty beyond inventory evidence. Missing required facts stop generation; research notes and communications are excluded from claim sources. Hand-editing out/ as truth is forbidden — fix inventory or intent, then regenerate.",
      },
      {
        id: "decisions",
        kind: "decisions",
        title: "Decisions",
        body: "Page-aware fact hints (including optional 2-page overrides) and achievement subsets keep length budgets without inventing bullets. Company overlays stay in application intent. Themes declare capabilities such as ats_baseline; CI runs generate, ATS structure checks, and visual theme-render snapshots so document quality is regression-tested rather than eyeballed once. The same inventory is designed to feed later channels (LinkedIn, bios, portfolio) without rewriting facts.",
      },
      {
        id: "outcomes",
        kind: "outcomes",
        title: "Outcomes",
        body: "Application packages such as riot-sydney-2026 generate tailored 1- and 2-page resumes and a recruiter reply from one shared inventory, with theme-aware PDF output and automated ATS / theme-render gates. The durable result is reusable knowledge architecture — not a one-off resume file.",
      },
      {
        id: "evidence",
        kind: "evidence",
        title: "Evidence",
        body: "The inventory repository is private (career PII and application notes). Architecture claims below are transcribed from its README, AGENTS handbook, and facts-vs-prose rules — not from a public demo URL.",
      },
    ],
    evidence: [
      {
        id: "layer-facts",
        label: "Canonical facts / roles / meta inventory (private repo)",
      },
      {
        id: "layer-overlays",
        label:
          "Application overlays: brief.yml + include.yml selection and tone",
      },
      {
        id: "layer-generate",
        label:
          "Deterministic generate → Markdown/PDF + ATS / theme-render checks",
      },
    ],
  },
  {
    slug: "renovate-governance",
    title: "Renovate governance ladder",
    summary:
      "A role-based agent workflow for dependency upgrades with explicit contracts, stop causes, investigation lanes, and merge-authority boundaries.",
    tags: ["agents", "governance", "dependencies", "workflows"],
    eyebrow: "Operational system",
    kind: "governance",
    sections: [
      {
        id: "system",
        kind: "system",
        title: "System",
        body: "Open Renovate PRs are handled through a manual four-step ladder: classify one active (non-draft) PR per run into a YAML execution packet; route to maintainer auto-path, investigation, or hard stop; optionally investigate high-touch/unlisted packages; then execute only when policy and CI allow. Draft Renovate PRs stay parked until marked ready — they are reported in discovery but not selectable by the ladder.",
      },
      {
        id: "role",
        kind: "role",
        title: "Contribution",
        body: "I designed and built the role-based AI engineering workflows — planning, review, verification, investigation, and publishing — with reusable contracts, authority constraints, and evaluation while developing production software. The Renovate ladder is one operationalization of that pattern: classifier, investigator, and maintainer agents with distinct write boundaries.",
      },
      {
        id: "constraints",
        kind: "constraints",
        title: "Constraints",
        body: "Merge authority is gated: the classifier never merges; the investigator has no merge authority and never passes --approved; the maintainer may merge only when packet shape, policy version, head SHA, and required checks allow — merge commits only. Investigation-approved execution remains restricted to dependency-only allowed paths. Hard stops and deferrals are first-class outcomes, not failures of the workflow.",
      },
      {
        id: "operation",
        kind: "operation",
        title: "Operation",
        body: "Operators run /renovate-classifier (or /renovate-loop for batch), route by packet, and for investigation-eligible stops run the investigator, human-audit the report, then invoke /renovate-maintainer --approved. Each maintainer run writes a gitignored audit report. Phase 6 automation triggers (schedules/webhooks) are deferred until the manual path is routine.",
      },
      {
        id: "decisions",
        kind: "decisions",
        title: "Decisions",
        body: "Plans and packets must name where agents stop — not only what to build. Authority handoffs, overridable stop_causes, and draft-parking for ecosystem majors keep automation from outrunning human judgment. Evidence-driven upgrade investigation replaces blind trust in green CI alone.",
      },
      {
        id: "evidence",
        kind: "evidence",
        title: "Evidence",
        body: "Public field reports below. No invented maintenance KPIs — the system’s value is explicit stop conditions and auditability.",
      },
    ],
    relatedLinks: [
      {
        id: "renovate-upgrades-article",
        label: "Upgrades don't have to be a blind trust exercise",
        url: "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj",
      },
      {
        id: "renovate-authority-article",
        label: "The agent plan had every step except where to stop",
        url: "https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h",
      },
    ],
    evidence: [
      {
        id: "article-evidence-upgrades",
        label: "Upgrades don't have to be a blind trust exercise",
        url: "https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj",
      },
      {
        id: "article-authority-handoffs",
        label: "The agent plan had every step except where to stop",
        url: "https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h",
      },
    ],
  },
];

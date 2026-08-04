import type { Project } from "@/domain/project";

/**
 * Projects transcribed from sibling workspace evidence
 * (`resumes/*`, `codenames-ai-guesser` docs/README). Manual copy only.
 * Section kinds are chosen after evidence audit — unsupported kinds omitted.
 * `featured` marks homepage flagships (Codenames + editorial).
 */
export const projects: Project[] = [
  {
    slug: "codenames-ai",
    title: "Codenames AI",
    summary:
      "A production AI-assisted Codenames experience with structured LLM outputs, deterministic validation, model evaluation, and product analytics.",
    tags: ["AI", "full-stack", "TypeScript", "OpenAI", "PostHog"],
    eyebrow: "Product case study",
    kind: "product",
    featured: true,
    sections: [
      {
        id: "problem",
        kind: "problem",
        title: "Problem",
        body: "Building an AI teammate that feels believable is less about getting a model to reply and more about making outputs safe to expose to players. Valid JSON can still propose illegal moves, echo clues as guesses, or violate board membership — so the hard problem is domain validation and recoverable failure, not prompt cleverness alone.",
      },
      {
        id: "role",
        kind: "role",
        title: "Role",
        body: "I built and operate the product end to end: React/TypeScript frontend, Node.js/Express API, OpenAI integrations, deterministic validation, analytics instrumentation, CI/CD, and multi-environment deployment across Vercel, Render, and Cloudflare.",
      },
      {
        id: "context",
        kind: "context",
        title: "Context",
        body: "Live at codenames-ai.com. Solo mode is the default: the app asks an AI Spymaster for clues (direct, JUDGE, or STRANGE strategies). In classic mode you play Spymaster and the AI guesses. The guesser never sees unrevealed card identities — it reasons from the clue and board state only.",
      },
      {
        id: "decisions",
        kind: "decisions",
        title: "Decisions",
        body: "Schema-first structured outputs (Zod) plus board-aware domain validators separate “valid JSON” from “legal move.” Model migrations across generations are treated as controlled experiments: live-product telemetry and contract checks surface compatibility failures before they become silent gameplay regressions. Evaluation is built into product behavior rather than left as an offline afterthought.",
      },
      {
        id: "outcomes",
        kind: "outcomes",
        title: "Outcomes",
        body: "Findings from telemetry and model experiments are documented in a public engineering field-report series on DEV — covering schema guardrails, model-swap stress tests, and analytics-quality pitfalls. Hard product KPIs are intentionally not claimed here; the durable outcome is a production system with explicit validation contracts and publishable engineering lessons.",
      },
      {
        id: "evidence",
        kind: "evidence",
        title: "Evidence",
        body: "Public product, repository docs, and DEV field reports linked below. Prefer those artifacts over invented traction metrics.",
      },
    ],
    relatedLinks: [
      {
        id: "codenames-live",
        label: "Live product — codenames-ai.com",
        url: "https://codenames-ai.com/",
      },
      {
        id: "codenames-github",
        label: "Source repository",
        url: "https://github.com/mastermichaelt/codenames-ai-guesser",
      },
    ],
    evidence: [
      {
        id: "article-schema-first",
        label: "Schema first, prompt second: valid JSON wasn't enough",
        url: "https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm",
      },
      {
        id: "article-model-experiments",
        label: "Model experiments became an architectural stress test",
        url: "https://dev.to/michaeltruong/model-experiments-became-an-architectural-stress-test-3gc0",
      },
      {
        id: "article-active-players",
        label:
          "Active players looked real until we asked which sessions counted",
        url: "https://dev.to/michaeltruong/active-players-looked-real-until-we-asked-which-sessions-counted-11em",
      },
    ],
  },
  {
    slug: "editorial-workflow",
    title: "AI-assisted editorial workflow",
    summary:
      "A human-in-the-loop editorial system that turns engineering artifacts into weekly field reports through planning, retrieval, drafting, critique, verification, and publication.",
    tags: ["agents", "workflows", "writing", "evaluation", "Notion"],
    eyebrow: "Workflow case study",
    kind: "workflow",
    featured: true,
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
        body: "Public runbook and field reports linked below. Prefer those artifacts over invented editorial KPIs.",
      },
    ],
    relatedLinks: [
      {
        id: "editorial-workflow-doc",
        label: "Editorial workflow (runbook)",
        url: "https://github.com/mastermichaelt/codenames-ai-guesser/blob/main/docs/editorial-workflow.md",
      },
      {
        id: "devto-blog",
        label: "DEV.to field reports",
        url: "https://dev.to/michaeltruong",
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
        body: "Public runbook and field reports below. No invented maintenance KPIs — the system’s value is explicit stop conditions and auditability.",
      },
    ],
    relatedLinks: [
      {
        id: "renovate-workflow-doc",
        label: "Renovate PR workflow (runbook)",
        url: "https://github.com/mastermichaelt/codenames-ai-guesser/blob/main/docs/renovate-workflow.md",
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

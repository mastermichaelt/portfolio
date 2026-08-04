import type { Project } from "@/domain/project";

/**
 * Case studies transcribed from sibling workspace evidence
 * (`resumes/facts/*`, `codenames-ai-guesser` docs/README). Manual copy only.
 * Section kinds are chosen after evidence audit — unsupported kinds omitted.
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

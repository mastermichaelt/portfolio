import type { ProductionLine } from "@/domain/production-line";

/**
 * Verbatim content for the locked Ecosystem 1b — "The Line".
 *
 * Every stage, lane cell and under-the-line item below is transcribed from the
 * locked `#1b` artboard (`Ecosystem Exploration.dc.html`). Copy is final: do not
 * rewrite, shorten or re-title. The five stages are fixed and identical across
 * every lane; each lane holds exactly five cells, one per stage, in order.
 *
 * Copy-lock exception (approved): `stages[0].passCondition` was reframed in the
 * secondary-route positioning pass to name the product requirement alongside the
 * stop line. Every other string in this file remains locked to the #1b artboard.
 */
export const productionLine: ProductionLine = {
  defaultSystemId: "codenames",
  stages: [
    {
      id: "intent",
      order: 1,
      name: "Intent",
      passCondition:
        "Passes when the work names what the product has to do and where it must stop, not only its steps.",
    },
    {
      id: "agent-execution",
      order: 2,
      name: "Agent execution",
      passCondition:
        "Passes when the output is structured enough to be checked mechanically.",
    },
    {
      id: "verification",
      order: 3,
      name: "Verification",
      passCondition:
        "Passes on a named reject class or a green check — never on a plausible reading.",
    },
    {
      id: "judgment",
      order: 4,
      name: "Judgment",
      passCondition:
        "Passes when a human or an adversarial pass has assessed what the checks cannot.",
    },
    {
      id: "evidence",
      order: 5,
      name: "Evidence",
      passCondition:
        "Passes when the claim carries its scope, or is not made at all.",
    },
  ],
  lanes: [
    {
      systemId: "codenames",
      name: "Codenames AI",
      cells: [
        {
          stageId: "intent",
          title: "Model migration as experiment",
          body: "A new model is not swapped in place; it runs as a controlled experiment with evaluation built into product behaviour.",
        },
        {
          stageId: "agent-execution",
          title: "Schema-first clue generation",
          body: "Structured outputs from OpenAI propose candidate clues; the JUDGE flow batches candidates rather than trusting the first reply.",
        },
        {
          stageId: "verification",
          title: "Board-aware domain validators",
          body: "Deterministic validation against a closed reject vocabulary: structure, membership, cardinality, completeness, consistency, survivors, provider.",
        },
        {
          stageId: "judgment",
          title: "Second-model judge, then telemetry",
          body: "Survivors go to a judge pass with a direct-clue fallback; the server-canonical pipeline-outcome event makes the failure mode reviewable afterwards.",
        },
        {
          stageId: "evidence",
          title: "Live product and three reports",
          body: "codenames-ai.com, with its qualified figures on the case study and three field reports on the calls behind it.",
        },
      ],
    },
    {
      systemId: "renovate",
      name: "Renovate governance",
      cells: [
        {
          stageId: "intent",
          title: "Policy file, with stop causes",
          body: "A consumer-owned policy file states which upgrades may proceed and which causes must stop the ladder.",
        },
        {
          stageId: "agent-execution",
          title: "Classifier emits a packet",
          body: "One active PR in, one YAML execution packet out. Draft PRs are skipped until ready; the classifier never merges.",
        },
        {
          stageId: "verification",
          title: "Maintainer re-verifies",
          body: "Packet and policy evidence are checked again against CI before anything is executed, by a role that did not write the packet.",
        },
        {
          stageId: "judgment",
          title: "Investigation lane",
          body: "High-touch and unlisted cases route to four-step evidence gathering and a human audit rather than a retry.",
        },
        {
          stageId: "evidence",
          title: "Two reports, no outcomes claim",
          body: "The case study deliberately carries no outcomes section — the ladder is the claim, and two field reports document it.",
        },
      ],
    },
    {
      systemId: "editorial",
      name: "Editorial workflow",
      cells: [
        {
          stageId: "intent",
          title: "One card reaches Drafting",
          body: "Capture, triage and schedule move ideas Inbox → Candidate → Drafting, promoting exactly one per week.",
        },
        {
          stageId: "agent-execution",
          title: "Context, then draft",
          body: "A bounded evidence packet is retrieved first — retrieval only, no prose — and the draft is written into repo markdown.",
        },
        {
          stageId: "verification",
          title: "Repo owns the body",
          body: "Ownership is explicit: Notion holds metadata, the repository holds the text, DEV holds the live post. Sync creates a draft only.",
        },
        {
          stageId: "judgment",
          title: "Critique analyses before it scores",
          body: "The adversarial pass separates reasoning from the QA checklist; a rubric score alone never advances a draft.",
        },
        {
          stageId: "evidence",
          title: "15 reports, published by hand",
          body: "Weekly cadence held; the irreversible publish step stayed with a person every time.",
        },
      ],
    },
    {
      systemId: "portfolio",
      name: "This portfolio",
      cells: [
        {
          stageId: "intent",
          title: "Plan with authority and topology",
          body: "Each slice is planned with its authority, scope and stop conditions written before any code is touched.",
        },
        {
          stageId: "agent-execution",
          title: "Slice at a time",
          body: "Typed content modules behind a repository seam keep an agent's blast radius inside one slice.",
        },
        {
          stageId: "verification",
          title: "Hooks, then CI",
          body: "Pre-commit runs lint, typecheck and format checks; CI adds coverage, build and a Playwright pass with path-aware gating.",
        },
        {
          stageId: "judgment",
          title: "Evidence audit",
          body: "Copy is checked against the fact inventory: a figure keeps its scope, and a contested count stays contested rather than averaged.",
        },
        {
          stageId: "evidence",
          title: "This site",
          body: "Every page you are reading passed the line above. Optional analytics; no tracking without a token.",
        },
      ],
    },
  ],
  infrastructure: [
    {
      id: "team-harness",
      name: "Team-harness plugin",
      body: "Planning methodology, repo bootstrap and the cloud-hooks primitive, versioned as one plugin.",
      meta: "v1.10.2 · private repo · no public URL",
    },
    {
      id: "hook-stack",
      name: "Four-layer hook stack",
      body: "Session start, file edit, pre-commit and CI — the same enforcement in local and cloud agent runs.",
      meta: "In force in this repo · scripts visible in source",
    },
    {
      id: "facts-inventory",
      name: "Facts inventory",
      body: "Canonical career and product facts stored once; prose may select and rephrase, never invent.",
      meta: "private repo · no public URL",
    },
    {
      id: "savepoints",
      name: "Savepoints",
      body: "Durable capture of decisions during agent work. Repo-local spool only; packaging and UI deferred.",
      meta: "prototype · not a shipped surface",
      prototype: true,
    },
  ],
};

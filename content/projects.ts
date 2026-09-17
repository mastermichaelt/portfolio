import type { Project } from "@/domain/project";

/**
 * Generic project inventory (infrastructure tier) rendered by the
 * `/projects/[slug]` case-study template. The two co-primary case studies
 * (`experiment-measurement`, `codenames-ai`) live in `content/project-cases.ts`,
 * and the two supporting-tier cases (`editorial-workflow`, `renovate-governance`)
 * live in `content/supporting-cases.ts` as richer presentation models; neither is
 * duplicated here.
 *
 * Transcribed from sibling workspace evidence (`resumes/*`, `codenames-ai-guesser`
 * docs/README). Manual copy only. Section kinds are chosen after evidence audit —
 * unsupported kinds omitted.
 */
export const projects: Project[] = [
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
];

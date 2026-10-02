import type { Project } from "@/domain/project";

/**
 * Generic project inventory (infrastructure tier) rendered by the
 * `/projects/[slug]` case-study template. The two co-primary case studies
 * (`experiment-measurement`, `codenames-ai`) live in `content/project-cases.ts`,
 * and the two supporting-tier cases (`editorial-workflow`, `renovate-governance`)
 * live in `content/supporting-cases.ts` as richer presentation models; neither is
 * duplicated here.
 *
 * The generic inventory is currently empty — resume-generator was withheld
 * pending a future redesign and is not exposed on the public portfolio.
 */
export const projects: Project[] = [];

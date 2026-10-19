import type { Project } from "@/domain/project";
import type { ProjectCase } from "@/domain/project-case";
import type { SupportingCase } from "@/domain/supporting-case";
import type { WorkflowView } from "@/domain/workflow-view";
import { getPortfolioRepository } from "@/lib/portfolio";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";

/** What `/projects/[slug]` renders; `null` exactly when the route 404s. */
export type CaseStudyEntry =
  | { kind: "case"; projectCase: ProjectCase }
  | {
      kind: "supporting";
      supportingCase: SupportingCase;
      workflowView: WorkflowView;
    }
  | { kind: "project"; project: Project };

/** Every slug the detail route prerenders (page and its social images). */
export async function listCaseStudyParams(
  repository: PortfolioRepository = getPortfolioRepository(),
): Promise<{ slug: string }[]> {
  const [cases, supporting, projects] = await Promise.all([
    repository.listProjectCases(),
    repository.listSupportingCases(),
    repository.listProjects(),
  ]);
  return [...cases, ...supporting, ...projects].map((entry) => ({
    slug: entry.slug,
  }));
}

/**
 * Single lookup for the detail route: project case, then supporting case, then
 * legacy project. A supporting case without a workflow view has no page.
 */
export async function resolveCaseStudyEntry(
  slug: string,
  repository: PortfolioRepository = getPortfolioRepository(),
): Promise<CaseStudyEntry | null> {
  const projectCase = await repository.getProjectCase(slug);
  if (projectCase) return { kind: "case", projectCase };

  const supportingCase = await repository.getSupportingCase(slug);
  if (supportingCase) {
    const workflowView = await repository.getProjectWorkflowView(slug);
    return workflowView
      ? { kind: "supporting", supportingCase, workflowView }
      : null;
  }

  const project = await repository.getProject(slug);
  return project ? { kind: "project", project } : null;
}

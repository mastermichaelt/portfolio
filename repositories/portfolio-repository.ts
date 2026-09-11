import type { Article } from "@/domain/article";
import type { Entity } from "@/domain/entities";
import type { Homepage } from "@/domain/homepage";
import type { Profile } from "@/domain/profile";
import type { Project } from "@/domain/project";
import type { ProjectCase } from "@/domain/project-case";
import type { ProjectsIndex } from "@/domain/projects-index";
import type { Relationship } from "@/domain/relationships";
import type { TimelineEvent } from "@/domain/timeline";
import type { WorkflowView } from "@/domain/workflow-view";

/**
 * Storage-agnostic portfolio data access.
 * Pages and UI should depend on this interface, not on a concrete store.
 */
export interface PortfolioRepository {
  getProfile(): Promise<Profile>;
  getHomepage(): Promise<Homepage>;
  /** The Projects 1C index composition (explicit ordering and tiering). */
  getProjectsIndex(): Promise<ProjectsIndex>;
  /** Co-primary case studies rendered with the 1C detail template. */
  listProjectCases(): Promise<ProjectCase[]>;
  getProjectCase(slug: string): Promise<ProjectCase | null>;
  /** Generic project inventory rendered with the standard case-study template. */
  listProjects(): Promise<Project[]>;
  getProject(slug: string): Promise<Project | null>;
  listArticles(): Promise<Article[]>;
  listEntities(): Promise<Entity[]>;
  listRelationships(): Promise<Relationship[]>;
  listWorkflowViews(): Promise<WorkflowView[]>;
  getWorkflowView(id: string): Promise<WorkflowView | null>;
  listTimelineEvents(): Promise<TimelineEvent[]>;
}

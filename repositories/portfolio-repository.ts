import type { AboutPage } from "@/domain/about";
import type { Article, ArticleLineDefinition } from "@/domain/article";
import type { Entity } from "@/domain/entities";
import type { Homepage } from "@/domain/homepage";
import type { Profile } from "@/domain/profile";
import type { Project } from "@/domain/project";
import type { ProjectCase } from "@/domain/project-case";
import type { SupportingCase } from "@/domain/supporting-case";
import type { ProductionLine } from "@/domain/production-line";
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
  /** The About "Standing Record" (2a) practice-record composition. */
  getAbout(): Promise<AboutPage>;
  getHomepage(): Promise<Homepage>;
  /** The Projects 1C index composition (explicit ordering and tiering). */
  getProjectsIndex(): Promise<ProjectsIndex>;
  /** Co-primary case studies rendered with the 1C detail template. */
  listProjectCases(): Promise<ProjectCase[]>;
  getProjectCase(slug: string): Promise<ProjectCase | null>;
  /** Supporting-tier case studies with a static architecture figure. */
  listSupportingCases(): Promise<SupportingCase[]>;
  getSupportingCase(slug: string): Promise<SupportingCase | null>;
  /** Generic project inventory rendered with the standard case-study template. */
  listProjects(): Promise<Project[]>;
  getProject(slug: string): Promise<Project | null>;
  listArticles(): Promise<Article[]>;
  /** The five `/articles` reasoning lines, in fixed render order. */
  listArticleLines(): Promise<ArticleLineDefinition[]>;
  listEntities(): Promise<Entity[]>;
  listRelationships(): Promise<Relationship[]>;
  listWorkflowViews(): Promise<WorkflowView[]>;
  getWorkflowView(id: string): Promise<WorkflowView | null>;
  /** Operational workflow canvas owned by a project page, when one exists. */
  getProjectWorkflowView(slug: string): Promise<WorkflowView | null>;
  /** The Ecosystem 1b "line": fixed stages, selectable lanes, shared infra. */
  getProductionLine(): Promise<ProductionLine>;
  listTimelineEvents(): Promise<TimelineEvent[]>;
}

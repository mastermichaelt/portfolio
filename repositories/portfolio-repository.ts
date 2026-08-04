import type { Article } from "@/domain/article";
import type { Entity } from "@/domain/entities";
import type { Project } from "@/domain/project";
import type { Relationship } from "@/domain/relationships";
import type { TimelineEvent } from "@/domain/timeline";

/**
 * Storage-agnostic portfolio data access.
 * Pages and UI should depend on this interface, not on a concrete store.
 */
export interface PortfolioRepository {
  listProjects(): Promise<Project[]>;
  getProject(slug: string): Promise<Project | null>;
  listArticles(): Promise<Article[]>;
  listEntities(): Promise<Entity[]>;
  listRelationships(): Promise<Relationship[]>;
  listTimelineEvents(): Promise<TimelineEvent[]>;
}

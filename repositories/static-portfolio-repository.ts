import { articles } from "@/content/articles";
import { entities, relationships } from "@/content/ecosystem";
import { projects } from "@/content/projects";
import { timelineEvents } from "@/content/timeline";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";

/** In-memory / static content implementation. Replace later with Supabase. */
export class StaticPortfolioRepository implements PortfolioRepository {
  async listProjects() {
    return projects;
  }

  async getProject(slug: string) {
    return projects.find((project) => project.slug === slug) ?? null;
  }

  async listArticles() {
    return articles;
  }

  async listEntities() {
    return entities;
  }

  async listRelationships() {
    return relationships;
  }

  async listTimelineEvents() {
    return timelineEvents;
  }
}

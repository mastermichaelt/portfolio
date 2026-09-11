import { articles } from "@/content/articles";
import { entities, relationships, workflowViews } from "@/content/ecosystem";
import { homepage } from "@/content/homepage";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { timelineEvents } from "@/content/timeline";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";

/** In-memory / static content implementation. Replace later with Supabase. */
export class StaticPortfolioRepository implements PortfolioRepository {
  async getProfile() {
    return profile;
  }

  async getHomepage() {
    return homepage;
  }

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

  async listWorkflowViews() {
    return workflowViews;
  }

  async getWorkflowView(id: string) {
    return workflowViews.find((view) => view.id === id) ?? null;
  }

  async listTimelineEvents() {
    return timelineEvents;
  }
}

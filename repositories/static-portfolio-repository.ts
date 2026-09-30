import { about } from "@/content/about";
import { articleLines } from "@/content/article-lines";
import { articles } from "@/content/articles";
import { codenamesExperience } from "@/content/codenames-experience";
import { entities, relationships, workflowViews } from "@/content/ecosystem";
import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import { homepage } from "@/content/homepage";
import { profile } from "@/content/profile";
import { productionLine } from "@/content/production-line";
import { projectCases } from "@/content/project-cases";
import { projects } from "@/content/projects";
import { supportingCases } from "@/content/supporting-cases";
import { projectsIndex } from "@/content/projects-index";
import { timelineEvents } from "@/content/timeline";
import type { PortfolioRepository } from "@/repositories/portfolio-repository";

/** In-memory / static content implementation. Replace later with Supabase. */
export class StaticPortfolioRepository implements PortfolioRepository {
  async getProfile() {
    return profile;
  }

  async getAbout() {
    return about;
  }

  async getHomepage() {
    return homepage;
  }

  async getProjectsIndex() {
    return projectsIndex;
  }

  async listProjectCases() {
    return projectCases;
  }

  async getProjectCase(slug: string) {
    return projectCases.find((entry) => entry.slug === slug) ?? null;
  }

  async getCodenamesExperience() {
    return codenamesExperience;
  }

  async listSupportingCases() {
    return supportingCases;
  }

  async getSupportingCase(slug: string) {
    return supportingCases.find((entry) => entry.slug === slug) ?? null;
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

  async listArticleLines() {
    return articleLines;
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

  async getProjectWorkflowView(slug: string) {
    return projectWorkflowViewsBySlug[slug] ?? null;
  }

  async getProductionLine() {
    return productionLine;
  }

  async listTimelineEvents() {
    return timelineEvents;
  }
}

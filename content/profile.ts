import type { Profile } from "@/domain/profile";

/**
 * Identity from sibling `resumes/meta/profile.yml` (+ thin bio from roles/facts).
 * Manual transcription — not imported at build time.
 */
export const profile: Profile = {
  name: "Michael Truong",
  location: "Sydney, Australia",
  email: "michael@multipliers.dev",
  headline: "Senior Software Engineer",
  bio: "Senior software engineer in Sydney. Growth experimentation, attribution and platform measurement at Atlassian, 2014–2025 (SWE, Engineering Manager, Atlassians in Mentoring). Independent AI products and agent-native engineering systems since 2026 — the same practice: measure it, validate it, and write down what the system is allowed to do. Engineering field reports on DEV.",
  links: {
    linkedin: "https://www.linkedin.com/in/michael-truong-dev",
    github: "https://github.com/mastermichaelt",
    blog: "https://dev.to/michaeltruong",
  },
  skillClusters: [
    "Frontend",
    "Experimentation and analytics",
    "Platforms",
    "AI-enabled products",
  ],
};

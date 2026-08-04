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
  bio: "Senior software engineer in Sydney. Previously at Atlassian across Growth (SWE and Engineering Manager) and Atlassians in Mentoring. Building production AI systems and publishing engineering field reports on DEV.",
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

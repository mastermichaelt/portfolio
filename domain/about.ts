import type { CaseFigure } from "@/domain/project-case";

/**
 * The About career-record presentation model — a numbered résumé-shaped document
 * beside a persistent identity rail. A distinct presentation concern from
 * `Profile` (which drives the rail's identity and contact). Figures reuse
 * `CaseFigure` so `scope` is non-optional and are rendered through the shared
 * `QualifiedFigure` component; `CaseFigure.source` is a review aid for verifying
 * figures against the inventory and is never rendered.
 */

/** A document link; outbound links render through `ExternalLink`. */
export interface AboutLink {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * One role or independent-project entry. `employmentType` carries résumé
 * metadata (Full-time, Concurrent Program, Supporting Project). `employmentNote`
 * distinguishes concurrent programs without forking the timeline.
 */
export interface AboutExperienceEntry {
  id: string;
  dateRange: string;
  role: string;
  org?: string;
  employmentType?: string;
  employmentNote?: string;
  bullets: string[];
  figures?: CaseFigure[];
  links?: AboutLink[];
  current?: boolean;
}

/**
 * Low-emphasis outbound link below a section body. `href` is resolved from
 * `Profile` at render time so contact URLs stay in one place.
 */
export interface AboutSectionSupplement {
  label: string;
  profileLink: "linkedin";
}

/** A numbered document section grouping experience entries. */
export interface AboutSection {
  ordinal: string;
  title: string;
  entries: AboutExperienceEntry[];
  supplement?: AboutSectionSupplement;
}

/** One skills cluster in §03 — label plus comma-separated items. */
export interface AboutSkillsCluster {
  label: string;
  items: string;
}

export interface AboutEducation {
  institution: string;
  degree: string;
  field: string;
  dateRange: string;
  honors: string[];
}

export interface AboutWorkRights {
  title: string;
  detail: string;
}

/** The closing block: the availability line and the mailto call to action. */
export interface AboutNext {
  label: string;
  statement: string;
  note: string;
}

export interface AboutPage {
  eyebrow: string;
  /** Document statement (h2). A career claim — never re-synced with the homepage hero. */
  statement: string;
  /** Two summary paragraphs transcribed from the résumé. */
  summary: string[];
  /** §01: Atlassian roles, newest first. */
  experience: AboutSection;
  /** §02: independent capability blocks. */
  independent: AboutSection;
  /** §03: résumé sidebar skills clusters. */
  skillsClusters: AboutSkillsCluster[];
  education: AboutEducation;
  workRights: AboutWorkRights;
  next: AboutNext;
}

export interface ProfileLinks {
  linkedin: string;
  github: string;
  blog: string;
}

/** Identity-scale About content — not a resume dump. */
export interface Profile {
  name: string;
  location: string;
  email: string;
  headline: string;
  /** Short bio composed from inventory facts; keep thin. */
  bio: string;
  /**
   * Hiring-availability line for the About rail. Author-supplied, not
   * inventory-derived; remove it the moment it stops being true.
   */
  status?: string;
  links: ProfileLinks;
  /** Optional light skill-cluster names only (not a full inventory). */
  skillClusters?: string[];
}

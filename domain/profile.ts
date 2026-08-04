export interface ProfileLinks {
  linkedin: string;
  github: string;
  blog: string;
  /** Optional product or site URL from career inventory. */
  portfolio?: string;
}

/** Identity-scale About content — not a resume dump. */
export interface Profile {
  name: string;
  location: string;
  email: string;
  headline: string;
  /** Short bio composed from inventory facts; keep thin. */
  bio: string;
  links: ProfileLinks;
  /** Optional light skill-cluster names only (not a full inventory). */
  skillClusters?: string[];
}

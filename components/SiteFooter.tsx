import { ExternalLink } from "@/components/ExternalLink";
import type { Profile } from "@/domain/profile";

export function SiteFooter({ profile }: { profile: Profile }) {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <a className="address" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <span>{profile.location}</span>
        <span className="site-footer-links">
          <ExternalLink href={profile.links.blog}>DEV</ExternalLink>
          <span aria-hidden="true"> · </span>
          <ExternalLink href={profile.links.github}>GitHub</ExternalLink>
          <span aria-hidden="true"> · </span>
          <ExternalLink href={profile.links.linkedin}>LinkedIn</ExternalLink>
        </span>
      </div>
    </footer>
  );
}

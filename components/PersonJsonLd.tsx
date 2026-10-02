import type { Profile } from "@/domain/profile";
import { getSiteUrl } from "@/lib/site";

const JOB_TITLES = ["Senior Software Engineer", "AI Product Engineer"];

export function buildPersonJsonLd(profile: Profile, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: JOB_TITLES,
    url: siteUrl,
    email: profile.email,
    homeLocation: {
      "@type": "Place",
      name: profile.location,
    },
    sameAs: [profile.links.linkedin, profile.links.github, profile.links.blog],
  };
}

export function PersonJsonLd({ profile }: { profile: Profile }) {
  const jsonLd = buildPersonJsonLd(profile, getSiteUrl());

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

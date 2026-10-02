import type { Profile } from "@/domain/profile";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";
import { getSiteUrl } from "@/lib/site";

const JOB_TITLES = ["Senior Software Engineer", "AI Product Engineer"];

/** Stable JSON-LD fragment identifiers under `{siteUrl}/#…`. */
export const JSON_LD_FRAGMENT = {
  website: "website",
  profilePage: "profilepage",
  person: "person",
} as const;

export type JsonLdFragment = keyof typeof JSON_LD_FRAGMENT;

export function jsonLdId(siteUrl: string, fragment: JsonLdFragment): string {
  return `${siteUrl}/#${JSON_LD_FRAGMENT[fragment]}`;
}

export function buildPersonJsonLd(profile: Profile, siteUrl: string) {
  const websiteId = jsonLdId(siteUrl, "website");
  const profilePageId = jsonLdId(siteUrl, "profilePage");
  const personId = jsonLdId(siteUrl, "person");

  const person = {
    "@type": "Person" as const,
    "@id": personId,
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

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite" as const,
        "@id": websiteId,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": personId },
      },
      {
        "@type": "ProfilePage" as const,
        "@id": profilePageId,
        url: siteUrl,
        name: SITE_NAME,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
      },
      person,
    ],
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

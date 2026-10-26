import Link from "next/link";

import { ExternalLink } from "@/components/ExternalLink";
import { profile } from "@/content/profile";
import {
  CONNECT_HEADLINE,
  CONNECT_LINKEDIN_ANALYTICS_LABEL,
  LINKEDIN_PROFILE_URL,
} from "@/lib/connect";
import { SITE_PORTRAIT_ALT } from "@/lib/social-metadata";

export default function ConnectPage() {
  return (
    <main id="content" className="connect-page">
      <div className="connect-shell">
        <div className="connect-card fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="connect-portrait"
            src="/connect-portrait.jpg"
            srcSet="/connect-portrait-400.jpg 400w, /connect-portrait-600.jpg 600w, /connect-portrait-900.jpg 900w, /connect-portrait-1200.jpg 1200w"
            sizes="9rem"
            alt={SITE_PORTRAIT_ALT}
            width={600}
            height={600}
            loading="eager"
            decoding="async"
          />

          <div className="connect-identity">
            <h1 className="connect-name">{profile.name}</h1>
            <p className="connect-headline">{CONNECT_HEADLINE}</p>
          </div>

          <div className="connect-qr-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="connect-qr"
              src="/linkedin-connect-qr.svg"
              alt="QR code linking to Michael Truong on LinkedIn"
              width={280}
              height={280}
              decoding="async"
            />
          </div>

          <nav className="connect-links" aria-label="Connect links">
            <ExternalLink
              href={LINKEDIN_PROFILE_URL}
              analyticsLabel={CONNECT_LINKEDIN_ANALYTICS_LABEL}
            >
              LinkedIn profile
            </ExternalLink>
            <ExternalLink href={profile.links.github}>GitHub</ExternalLink>
            <Link href="/">Portfolio home</Link>
          </nav>
        </div>
      </div>
    </main>
  );
}

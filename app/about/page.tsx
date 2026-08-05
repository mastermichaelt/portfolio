import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ExternalLink";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "About",
  description:
    "Michael Truong — senior software engineer in Sydney. Contact via email, LinkedIn, GitHub, and DEV.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
  },
};

export default async function AboutPage() {
  const profile = await getPortfolioRepository().getProfile();

  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container hero-split fade-in">
          <div>
            <p className="eyebrow">About · Contact</p>
            <h1
              className="brand-mark"
              style={{ fontSize: "clamp(40px, 6vw, 64px)" }}
            >
              {profile.name}
            </h1>
            <p className="positioning" style={{ maxWidth: "34ch" }}>
              {profile.headline} in {profile.location}.
            </p>
            <p className="lead">{profile.bio}</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href={`mailto:${profile.email}`}>
                Email me
              </a>
              <Link className="btn btn-secondary btn-arrow" href="/projects">
                Browse projects
              </Link>
            </div>
          </div>
          <div className="card">
            <p className="meta card-label">Contact</p>
            <ul className="contact-list">
              <li>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
              <li>
                <ExternalLink href={profile.links.linkedin}>
                  LinkedIn
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={profile.links.github}>GitHub</ExternalLink>
              </li>
              <li>
                <ExternalLink href={profile.links.blog}>DEV blog</ExternalLink>
              </li>
            </ul>
            {profile.skillClusters?.length ? (
              <>
                <hr className="rule rule-block" />
                <p className="meta meta-flush">Focus areas</p>
                <div className="skill-row">
                  {profile.skillClusters.map((cluster) => (
                    <span key={cluster} className="tag">
                      {cluster}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

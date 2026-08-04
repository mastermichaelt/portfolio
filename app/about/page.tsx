import type { Metadata } from "next";
import Link from "next/link";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "About",
  description:
    "Michael Truong — senior software engineer in Sydney. Contact via email, LinkedIn, GitHub, and DEV.",
};

export default async function AboutPage() {
  const profile = await getPortfolioRepository().getProfile();

  return (
    <main id="content">
      <section className="section hero" style={{ paddingBottom: 32 }}>
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
            <div className="hero-cta" style={{ marginTop: 28 }}>
              <a className="btn btn-primary" href={`mailto:${profile.email}`}>
                Email me
              </a>
              <Link className="btn btn-secondary btn-arrow" href="/projects">
                Browse projects
              </Link>
            </div>
          </div>
          <div className="card">
            <p className="meta" style={{ margin: "0 0 12px" }}>
              Contact
            </p>
            <ul className="contact-list">
              <li>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
              <li>
                <a href={profile.links.linkedin} rel="noopener noreferrer">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={profile.links.github} rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <a href={profile.links.blog} rel="noopener noreferrer">
                  DEV blog
                </a>
              </li>
            </ul>
            {profile.skillClusters?.length ? (
              <>
                <hr className="rule" style={{ margin: "20px 0" }} />
                <p className="meta" style={{ margin: 0 }}>
                  Focus areas
                </p>
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

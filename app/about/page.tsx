import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ExternalLink";
import { QualifiedFigure } from "@/components/QualifiedFigure";
import type { AboutExperienceEntry, AboutLink } from "@/domain/about";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "About",
  description:
    "Michael Truong — career record: 12+ years building production software at Atlassian Growth and independent AI products since 2026.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
  },
};

function AboutEntryLinks({ links }: { links: AboutLink[] }) {
  return (
    <div className="about-entry-links">
      {links.map((link) =>
        link.external ? (
          <ExternalLink key={link.href} href={link.href}>
            {link.label}
          </ExternalLink>
        ) : (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
}

function AboutExperienceRole({ entry }: { entry: AboutExperienceEntry }) {
  const hasFigures = (entry.figures?.length ?? 0) > 0;

  return (
    <li
      className={entry.current ? "about-role is-current" : "about-role"}
      key={entry.id}
    >
      <div className="about-role-meta">
        <p className="about-role-date">{entry.dateRange}</p>
        {entry.employmentType ? (
          <p className="about-role-type">{entry.employmentType}</p>
        ) : null}
      </div>
      <div className="about-role-body">
        <p className="about-role-heading">
          <strong className="about-role-title">
            {entry.role}
            {entry.org ? ` · ${entry.org}` : ""}
          </strong>
        </p>
        {entry.employmentNote ? (
          <p className="about-employment-note">{entry.employmentNote}</p>
        ) : null}
        <div className={hasFigures ? "about-role-grid" : undefined}>
          <ul className="about-role-bullets">
            {entry.bullets.map((bullet) => (
              <li key={bullet.slice(0, 48)}>{bullet}</li>
            ))}
          </ul>
          {hasFigures ? (
            <div className="about-role-figures">
              {entry.figures?.map((figure) => (
                <QualifiedFigure key={figure.name} figure={figure} />
              ))}
            </div>
          ) : null}
        </div>
        {entry.links?.length ? <AboutEntryLinks links={entry.links} /> : null}
      </div>
    </li>
  );
}

export default async function AboutPage() {
  const repository = getPortfolioRepository();
  const [profile, about] = await Promise.all([
    repository.getProfile(),
    repository.getAbout(),
  ]);

  return (
    <main id="content">
      <div className="container">
        <div className="about-shell fade-in">
          <aside className="about-rail">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="about-portrait"
              src="/portrait-michael.jpg"
              srcSet="/portrait-michael-200.jpg 200w, /portrait-michael-300.jpg 300w, /portrait-michael-400.jpg 400w, /portrait-michael-600.jpg 600w, /portrait-michael-900.jpg 900w, /portrait-michael-1200.jpg 1200w"
              sizes="(max-width: 700px) 100vw, (max-width: 920px) 200px, 300px"
              alt={profile.name}
              width={1200}
              height={1500}
              loading="eager"
              decoding="async"
            />

            <div className="about-identity">
              <h1 className="about-name">{profile.name}</h1>
              <p className="about-headline">
                {profile.headline}
                <br />
                {profile.location}
              </p>
            </div>

            {profile.status ? (
              <div className="about-rail-block about-rail-block--status">
                <p className="about-rail-label about-rail-label--status">
                  Status
                </p>
                <p className="about-status">{profile.status}</p>
              </div>
            ) : null}

            <div className="about-rail-block about-rail-block--contact">
              <p className="about-rail-label">Contact</p>
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
                  <ExternalLink href={profile.links.github}>
                    GitHub
                  </ExternalLink>
                </li>
                <li>
                  <ExternalLink href={profile.links.blog}>
                    DEV blog
                  </ExternalLink>
                </li>
              </ul>
            </div>

            {profile.skillClusters?.length ? (
              <div className="about-rail-block about-rail-block--focus">
                <p className="about-rail-label">Focus areas</p>
                <div className="about-focus">
                  {profile.skillClusters.map((cluster) => (
                    <span key={cluster}>{cluster}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <div className="about-doc">
            <p className="about-eyebrow">{about.eyebrow}</p>
            <h2 className="about-page-statement">{about.statement}</h2>
            {about.summary.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="about-summary">
                {paragraph}
              </p>
            ))}

            {/* §01 Professional Experience */}
            <section className="about-section about-section--strong">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  {about.experience.ordinal}
                </span>
                <h3 className="about-cat">{about.experience.title}</h3>
              </div>
              <ol className="about-roles">
                {about.experience.entries.map((entry) => (
                  <AboutExperienceRole key={entry.id} entry={entry} />
                ))}
              </ol>
            </section>

            {/* §02 Independent Projects */}
            <section className="about-section">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  {about.independent.ordinal}
                </span>
                <h3 className="about-cat">{about.independent.title}</h3>
              </div>
              <ol className="about-roles">
                {about.independent.entries.map((entry) => (
                  <AboutExperienceRole key={entry.id} entry={entry} />
                ))}
              </ol>
            </section>

            {/* §03 Skills · Education & work rights */}
            <section className="about-section">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  03
                </span>
                <h3 className="about-cat">
                  Skills · Education &amp; work rights
                </h3>
              </div>
              <dl className="about-skills">
                {about.skillsClusters.map((cluster) => (
                  <div className="about-skills-row" key={cluster.label}>
                    <dt className="about-skills-label">{cluster.label}</dt>
                    <dd className="about-skills-items">{cluster.items}</dd>
                  </div>
                ))}
              </dl>
              <div className="about-education">
                <p className="about-education-institution">
                  <strong>{about.education.institution}</strong>
                </p>
                <p className="about-education-degree">
                  {about.education.degree} · {about.education.field}
                </p>
                <p className="about-education-dates">
                  {about.education.dateRange}
                </p>
                {about.education.honors.length ? (
                  <ul className="about-education-honors">
                    {about.education.honors.map((honor) => (
                      <li key={honor.slice(0, 32)}>{honor}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="about-work-rights">
                <p className="about-work-rights-title">
                  <strong>{about.workRights.title}</strong>
                </p>
                <p className="about-work-rights-detail">
                  {about.workRights.detail}
                </p>
              </div>
            </section>

            {/* Closing block */}
            <section className="about-close about-section--strong">
              <div>
                <p className="about-close-label">{about.next.label}</p>
                <p className="about-close-statement">{about.next.statement}</p>
                <p className="about-close-note">{about.next.note}</p>
              </div>
              <a
                className="btn btn-primary about-close-cta"
                href={`mailto:${profile.email}`}
              >
                {profile.email}
              </a>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

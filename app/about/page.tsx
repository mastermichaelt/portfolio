import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ExternalLink";
import { QualifiedFigure } from "@/components/QualifiedFigure";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "About",
  description:
    "Michael Truong — one engineering practice from 2014 to now: Growth experimentation and platform measurement at Atlassian, independent AI products since 2026, and the mechanisms each era left behind.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
  },
};

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
            {/* Identity portrait: hand-rolled with height:auto so aspect-ratio
                governs the box; next/image is not used in this app and the
                handoff blesses the hand-rolled img. Sizes track the three rail
                widths: full viewport width when the rail becomes a header block
                at ≤700px, 200px as a ≤920px header column, else the 300px
                desktop rail. Derivatives are regenerated from the locked-crop
                4:5 master. */}
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
            <p className="about-lead">
              {about.lead.text}{" "}
              <span className="about-lead-emph">{about.lead.emphasis}</span>
            </p>

            {/* §01 Through-line */}
            <section className="about-section about-section--strong">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  01
                </span>
                <h3 className="about-cat">Through-line</h3>
              </div>
              {about.throughLine.map((paragraph, index) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className={index === 0 ? "about-through" : "about-turn"}
                >
                  {paragraph}
                </p>
              ))}
            </section>

            {/* §02 Practice arc */}
            <section className="about-section">
              <div className="about-section-head about-section-head--arc">
                <span className="about-ordinal" aria-hidden="true">
                  02
                </span>
                <h3 className="about-cat">
                  Practice arc · what each era left behind
                </h3>
              </div>
              <div className="about-arc-grid">
                <ol className="about-arc">
                  {about.arc.map((era) => (
                    <li
                      key={era.id}
                      className={
                        era.current ? "about-era is-current" : "about-era"
                      }
                    >
                      <p className="about-era-date">{era.dateRange}</p>
                      <div className="about-era-body">
                        <p className="about-era-lede">
                          <strong className="about-era-role">
                            {era.role}
                            {era.org ? `, ${era.org}` : ""}.
                          </strong>{" "}
                          {era.body}
                        </p>
                        {era.carry ? (
                          <p className="about-carry">
                            <span className="about-carry-label">
                              {era.carry.label} —
                            </span>{" "}
                            {era.carry.text}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="about-arc-gutter">
                  <p className="about-gutter-label">
                    {about.arcEvidence.label}
                  </p>
                  <QualifiedFigure figure={about.arcEvidence.figure} />
                  <p className="about-ledger-note">
                    {about.arcEvidence.ledgerNote.lead}
                    <Link href={about.arcEvidence.ledgerNote.link.href}>
                      {about.arcEvidence.ledgerNote.link.label}
                    </Link>
                  </p>
                </div>
              </div>
            </section>

            {/* §03 Management band */}
            <section className="about-section">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  03
                </span>
                <h3 className="about-cat">
                  Experiment operations &amp; program scale · 2020 – 2025
                </h3>
              </div>
              <h4 className="about-statement">{about.management.statement}</h4>
              <div className="about-band-grid">
                <div className="about-band-narrative">
                  {about.management.body.map((paragraph, index) => (
                    <p
                      key={paragraph.slice(0, 24)}
                      className={
                        index === about.management.body.length - 1
                          ? "about-band-body about-band-body--turn"
                          : "about-band-body"
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="about-figures">
                  {about.management.figures.map((figure) => (
                    <QualifiedFigure key={figure.name} figure={figure} />
                  ))}
                </div>
              </div>
            </section>

            {/* §04 Current practice */}
            <section className="about-section">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  04
                </span>
                <h3 className="about-cat">Current practice · 2026 —</h3>
              </div>
              <div className="about-band-grid">
                <div className="about-band-narrative">
                  <p className="about-band-body">{about.current.body}</p>
                  <p className="about-map-label">{about.current.mapLabel}</p>
                  <dl className="about-map">
                    {about.current.map.map((row) => (
                      <div className="about-map-row" key={row.then}>
                        <dt className="about-map-then">{row.then}</dt>
                        <dd className="about-map-now">{row.now}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="about-current-gutter">
                  {about.current.figures.map((figure) => (
                    <QualifiedFigure key={figure.name} figure={figure} />
                  ))}
                  <div className="about-links">
                    {about.current.links.map((link) =>
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
                </div>
              </div>
            </section>

            {/* §05 Four-surface boundary */}
            <section className="about-section">
              <div className="about-section-head">
                <span className="about-ordinal" aria-hidden="true">
                  05
                </span>
                <h3 className="about-cat">Where each thing lives</h3>
              </div>
              <dl className="about-surfaces">
                {about.surfaces.map((surface) => (
                  <div className="about-surface-row" key={surface.name}>
                    <dt
                      className={
                        surface.self
                          ? "about-surface-name about-surface-name--self"
                          : "about-surface-name"
                      }
                    >
                      {surface.href ? (
                        <Link className="text-link" href={surface.href}>
                          {surface.name}
                        </Link>
                      ) : (
                        surface.name
                      )}
                    </dt>
                    <dd className="about-surface-desc">
                      {surface.description}
                    </dd>
                  </div>
                ))}
              </dl>
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

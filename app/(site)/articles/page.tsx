import type { Metadata } from "next";
import Link from "next/link";
import { resolveArticleSystem } from "@/content/article-lines";
import { ExternalLink } from "@/components/ExternalLink";
import { groupArticleLines } from "@/lib/article-lines";
import { getPortfolioRepository } from "@/lib/portfolio";
import { openGraphForCanonicalPath } from "@/lib/social-metadata";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Weekly AI Engineering Field Reports on DEV.to, grouped into five themes: measurement, authority, critique, readiness, and agent portability.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: openGraphForCanonicalPath("/articles"),
};

const DEV_ARCHIVE_URL = "https://dev.to/michaeltruong";

export default async function ArticlesPage() {
  const repository = getPortfolioRepository();
  const [articles, lines] = await Promise.all([
    repository.listArticles(),
    repository.listArticleLines(),
  ]);

  const bands = groupArticleLines(lines, articles, resolveArticleSystem);

  return (
    <main id="content">
      <div className="container">
        <section className="aline-hero fade-in">
          <div className="aline-intro">
            <p className="eyebrow">Articles</p>
            <h1>The writing returns to five problems.</h1>
            <p className="aline-hero-lead">
              Weekly field reports from systems I operate. Each section states
              one lesson, recommends where to start reading, then lists the rest
              on DEV.
            </p>
          </div>
          <aside className="aline-register">
            <p className="aline-register-label">Register</p>
            <div className="aline-register-facts">
              <span className="aline-register-fact">
                {articles.length} published
              </span>
              <span className="aline-register-fact">weekly practice</span>
              <span className="aline-register-fact">{lines.length} themes</span>
            </div>
            <p className="aline-register-note">
              Recognized as a{" "}
              <ExternalLink
                className="text-link"
                href="https://dev.to/trusted-member#what-is-a-trusted-member"
              >
                Trusted Member
              </ExternalLink>{" "}
              of the DEV Community, contributing to community moderation and
              content quality.
            </p>
          </aside>
        </section>

        <nav className="aline-index" aria-label="Article themes">
          {bands.map((band) => (
            <a
              key={band.id}
              className="aline-cell"
              href={`#line-${band.ordinal}`}
            >
              <span className="aline-cell-top">
                <span className="aline-cell-id">{band.ordinal}</span>
                <span className="aline-cell-count">{band.count}</span>
              </span>
              <span className="aline-cell-label" data-ordinal={band.ordinal}>
                {band.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="aline-bands fade-in delay-1">
          {bands.map((band) => (
            <section
              key={band.id}
              id={`line-${band.ordinal}`}
              className="aline-band"
            >
              <header className="aline-head">
                <h2>{band.label}</h2>
                <p className="aline-count">
                  {band.count} {band.count === 1 ? "report" : "reports"}
                </p>
              </header>

              <p className="aline-insight">{band.lead.argument}</p>

              <article className="aline-start">
                <p className="aline-start-label">Start here</p>
                <ExternalLink
                  className="aline-start-link"
                  href={band.lead.article.url}
                  aria-labelledby={`aline-start-title-${band.lead.article.slug}`}
                  analyticsLabel={band.lead.article.title}
                >
                  <span
                    id={`aline-start-title-${band.lead.article.slug}`}
                    className="aline-start-title"
                  >
                    {band.lead.article.title}
                    <span className="sr-only"> (opens in new tab)</span>
                  </span>
                  <span className="aline-start-dev" aria-hidden="true">
                    DEV ↗
                  </span>
                </ExternalLink>
                {band.lead.system?.href ? (
                  <Link
                    className="aline-start-project"
                    href={band.lead.system.href}
                  >
                    {band.lead.system.label} →
                  </Link>
                ) : null}
              </article>

              {band.reports.length > 0 ? (
                <div className="aline-more">
                  {band.reports.map((row) => (
                    <ExternalLink
                      key={row.article.slug}
                      className="aline-row"
                      href={row.article.url}
                      aria-labelledby={`aline-row-title-${row.article.slug}`}
                      analyticsLabel={row.article.title}
                    >
                      <span
                        id={`aline-row-title-${row.article.slug}`}
                        className="aline-row-title"
                      >
                        {row.article.title}
                        <span className="sr-only"> (opens in new tab)</span>
                      </span>
                      <span className="aline-row-dev" aria-hidden="true">
                        DEV ↗
                      </span>
                    </ExternalLink>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <section className="aline-closing">
          <div className="anchor-pair">
            <Link className="anchor" href="/projects">
              <span>The systems these lines run through</span>
              <span className="anchor-id">Projects →</span>
            </Link>
            <Link className="anchor" href="/about">
              <span>How the practice developed</span>
              <span className="anchor-id">About →</span>
            </Link>
          </div>
          <p className="aline-archive">
            Every report is published on DEV.{" "}
            <ExternalLink className="aline-archive-link" href={DEV_ARCHIVE_URL}>
              Full archive ↗
            </ExternalLink>
          </p>
        </section>
      </div>
    </main>
  );
}

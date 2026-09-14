import type { Metadata } from "next";
import Link from "next/link";
import { articleSystems } from "@/content/article-lines";
import { ExternalLink } from "@/components/ExternalLink";
import {
  articleLineIndex,
  groupArticleLines,
  type ResolveSystem,
} from "@/lib/article-lines";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Weekly AI Engineering Field Reports on DEV.to, organized into five lines of reasoning — measurement, authority, critique, readiness and agent portability.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    url: "/articles",
  },
};

const resolveSystem: ResolveSystem = (slug) =>
  slug ? (articleSystems[slug] ?? null) : null;

const DEV_ARCHIVE_URL = "https://dev.to/michaeltruong";

export default async function ArticlesPage() {
  const repository = getPortfolioRepository();
  const [articles, lines] = await Promise.all([
    repository.listArticles(),
    repository.listArticleLines(),
  ]);

  const bands = groupArticleLines(lines, articles, resolveSystem);
  const index = articleLineIndex(bands);

  return (
    <main id="content">
      <div className="container">
        {/* Opening — positioning lead and the corpus register */}
        <section className="aline-hero fade-in">
          <div className="aline-intro">
            <p className="eyebrow">Articles / lines of reasoning</p>
            <h1>The writing returns to five problems.</h1>
            <p className="aline-hero-lead">
              Weekly AI Engineering Field Reports, written from systems I
              operate. Each line below opens with the argument that line has
              arrived at; the report that makes the case sits underneath it, and
              the body stays on DEV.
            </p>
          </div>
          <aside className="aline-register">
            <p className="aline-register-label">Register</p>
            <div className="aline-register-facts">
              <span className="aline-register-fact">
                {articles.length} published
              </span>
              <span className="aline-register-fact">weekly practice</span>
              <span className="aline-register-fact">
                {lines.length} lines of reasoning
              </span>
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

        {/* Line index — the page's navigation structure (not sticky) */}
        <nav className="aline-index" aria-label="Lines of reasoning">
          {index.map((cell) => (
            <a
              key={cell.id}
              className="aline-cell"
              href={`#line-${cell.ordinal}`}
            >
              <span className="aline-cell-top">
                <span className="aline-cell-id">{cell.ordinal}</span>
                <span className="aline-cell-count">{cell.count}</span>
              </span>
              <span className="aline-cell-label" data-ordinal={cell.ordinal}>
                {cell.label}
              </span>
            </a>
          ))}
        </nav>

        {/* Five bands, in fixed order */}
        <div className="aline-bands fade-in delay-1">
          {bands.map((band) => (
            <section
              key={band.id}
              id={`line-${band.ordinal}`}
              className="aline-band"
            >
              <div className="aline-head">
                <div className="aline-head-title">
                  <span className="aline-line-id">LINE {band.ordinal}</span>
                  <h2>{band.label}</h2>
                </div>
                <p className="aline-pairing">
                  {band.count} reports · {band.pairs}
                </p>
              </div>

              <article className="aline-lead">
                <div className="aline-lead-main">
                  <p className="aline-claim">{band.lead.argument}</p>
                  <ExternalLink
                    className="aline-report"
                    href={band.lead.article.url}
                    aria-label={band.lead.article.title}
                  >
                    <span className="aline-report-tag">Report</span>
                    <span className="aline-report-title">
                      {band.lead.article.title}
                    </span>
                    <span className="aline-report-dev">DEV ↗</span>
                  </ExternalLink>
                </div>
                <div className="aline-meta">
                  {band.lead.system?.href ? (
                    <Link className="aline-impl" href={band.lead.system.href}>
                      implementation · {band.lead.system.label} →
                    </Link>
                  ) : (
                    <span className="aline-impl-none">
                      no implementation attached
                    </span>
                  )}
                </div>
              </article>

              {band.reports.map((row) => (
                <ExternalLink
                  key={row.article.slug}
                  className="aline-row"
                  href={row.article.url}
                  aria-label={row.article.title}
                >
                  <span className="aline-row-title">{row.article.title}</span>
                  <span className="aline-row-meta">
                    <span className="aline-row-system">
                      {row.system?.label ?? ""}
                    </span>
                    <span className="aline-row-dev">DEV ↗</span>
                  </span>
                </ExternalLink>
              ))}

              {band.note ? <p className="aline-note">{band.note}</p> : null}
            </section>
          ))}
        </div>

        {/* Closing — the two adjacent evidence surfaces, then the DEV archive */}
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
            Every report is published on DEV —{" "}
            <ExternalLink className="aline-archive-link" href={DEV_ARCHIVE_URL}>
              full archive ↗
            </ExternalLink>
          </p>
        </section>
      </div>
    </main>
  );
}

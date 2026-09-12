import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ExternalLink";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: {
    absolute: "Michael Truong · Making uncertain systems dependable",
  },
  description:
    "Senior software engineer in Sydney. Atlassian measurement and verification practice (2014–2025), independent AI products since 2026, and evidence-backed field reports.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default async function HomePage() {
  const repository = getPortfolioRepository();
  const [profile, homepage, articles] = await Promise.all([
    repository.getProfile(),
    repository.getHomepage(),
    repository.listArticles(),
  ]);

  const articlesBySlug = new Map(
    articles.map((article) => [article.slug, article]),
  );
  const writing = homepage.writing.map((item) => {
    const article = articlesBySlug.get(item.slug);
    if (!article) {
      throw new Error(
        `Homepage writing slug missing from article inventory: ${item.slug}`,
      );
    }
    return { item, article };
  });

  return (
    <main id="content" className="home">
      <section className="section hero hero-home">
        <div className="container fade-in">
          <p className="label">
            {profile.headline} / {profile.location}
          </p>
          <h1>{homepage.hero.title}</h1>
          <p className="lead">
            {homepage.hero.lead} <strong>{homepage.hero.leadEmphasis}</strong>
          </p>
          <div className="anchor-pair">
            {homepage.channels.map((channel) => (
              <Link key={channel.id} className="anchor" href={channel.href}>
                <span>{channel.anchorLabel}</span>
                <span className="anchor-id">{channel.channelLabel} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section fade-in delay-1">
        <div className="container">
          <div className="section-head">
            <h2>Two systems, one method</h2>
            <p className="label">01 / instrumented</p>
          </div>
          <div className="case-grid">
            {homepage.channels.map((channel) => {
              const panelId = channel.href.startsWith("#")
                ? channel.href.slice(1)
                : undefined;
              const thesisIsRoute = channel.href.startsWith("/");

              return (
                <article key={channel.id} className="case-panel" id={panelId}>
                  <div className="case-head">
                    <span className="case-id">
                      {channel.channelLabel} · {channel.title}
                    </span>
                    <span className="meta">{channel.dateRange}</span>
                  </div>
                  <h3>
                    {thesisIsRoute ? (
                      <Link href={channel.href}>{channel.thesis}</Link>
                    ) : (
                      channel.thesis
                    )}
                  </h3>
                  <div className="spine">
                    <div>
                      <p className="label spine-term">Uncertain</p>
                      <p>{channel.spine.uncertain}</p>
                    </div>
                    <div>
                      <p className="label spine-term">Made checkable</p>
                      <p>{channel.spine.checkable}</p>
                    </div>
                    <div>
                      <p className="label spine-term">Contract</p>
                      <p className="contract">{channel.spine.contract}</p>
                    </div>
                  </div>
                  <div className="figures">
                    {channel.figures.map((figure) => (
                      <div key={figure.source.factId}>
                        <p className="figure-value">{figure.value}</p>
                        <p className="figure-name">{figure.name}</p>
                        <p className="figure-scope">{figure.scope}</p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="career-ledger" className="section fade-in delay-2">
        <div className="container">
          <div className="section-head">
            <h2>Career ledger</h2>
            <p className="label">02 / 2014 – present</p>
          </div>
          <div className="ledger">
            {homepage.ledger.map((row) => (
              <div
                key={row.id}
                className={row.current ? "ledger-row is-current" : "ledger-row"}
              >
                <span className="ledger-date">{row.dateRange}</span>
                <span className="ledger-role">
                  {row.role}
                  {row.org ? (
                    <span className="ledger-org">{row.org}</span>
                  ) : null}
                </span>
                <span className="ledger-detail">{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section fade-in delay-2">
        <div className="container two-col">
          <div>
            <h2 className="list-head">Supporting work</h2>
            {homepage.supporting.map((item) => (
              <Link key={item.id} className="list-row" href={item.href}>
                <p className="list-row-title">{item.title}</p>
                <p>{item.summary}</p>
              </Link>
            ))}
            <p className="list-note">
              How these systems connect —{" "}
              <Link href="/ecosystem">ecosystem walkthrough →</Link>
            </p>
          </div>
          <div>
            <h2 className="list-head">Selected writing</h2>
            {writing.map(({ item, article }) => (
              <ExternalLink
                key={article.slug}
                className="list-row"
                href={article.url}
                aria-label={article.title}
              >
                <p className="list-row-title">{article.title}</p>
                <p>{item.argument}</p>
              </ExternalLink>
            ))}
            <p className="list-note">
              Field reports on DEV, which holds the full archive.{" "}
              <ExternalLink href={profile.links.blog}>
                {profile.links.blog.replace(/^https:\/\//, "")} →
              </ExternalLink>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

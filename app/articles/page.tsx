import type { Metadata } from "next";
import { ExternalLink } from "@/components/ExternalLink";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Engineering field reports on DEV.to — agents, evaluation, governance, and AI product systems.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    url: "/articles",
  },
};

export default async function ArticlesPage() {
  const articles = await getPortfolioRepository().listArticles();

  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container container-narrow fade-in">
          <p className="eyebrow">Articles</p>
          <h1>Writing that makes the system legible.</h1>
          <p className="lead lead-follow">
            Full published field-report archive on DEV.to — linked from real
            projects where they fit. Recognized as a{" "}
            <ExternalLink href="https://dev.to/trusted-member#what-is-a-trusted-member">
              Trusted Member
            </ExternalLink>{" "}
            of the DEV Community, contributing to community moderation and
            content quality.
          </p>
        </div>
      </section>

      <section className="section section-flush">
        <div className="container fade-in delay-1">
          {articles.map((article) => (
            <ExternalLink
              key={article.slug}
              className="log-row"
              href={article.url}
            >
              <span className="meta">{article.year}</span>
              <div>
                <h3>{article.title}</h3>
                <p className="meta log-summary">{article.summary}</p>
                {article.tags.length > 0 ? (
                  <div className="tag-row">
                    {article.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <span className="meta pull">DEV →</span>
            </ExternalLink>
          ))}
        </div>
      </section>
    </main>
  );
}

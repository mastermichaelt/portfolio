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
      <section className="section hero" style={{ paddingBottom: 32 }}>
        <div className="container fade-in" style={{ maxWidth: 720 }}>
          <p className="eyebrow">Articles</p>
          <h1>Writing that makes the system legible.</h1>
          <p className="lead" style={{ marginTop: 16 }}>
            Full published field-report archive on DEV.to — linked from real
            projects where they fit.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
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
                <p
                  className="meta"
                  style={{ margin: "6px 0 0", maxWidth: "62ch" }}
                >
                  {article.summary}
                </p>
                {article.tags.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
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

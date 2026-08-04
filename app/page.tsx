import type { Metadata } from "next";
import Link from "next/link";
import { SystemsDiagram } from "@/components/SystemsDiagram";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: {
    absolute: "Michael Truong · AI engineering systems",
  },
  description:
    "Senior software engineer in Sydney. Browse production AI systems, editorial workflows, and field reports.",
};

export default async function HomePage() {
  const repository = getPortfolioRepository();
  const [profile, projects, articles] = await Promise.all([
    repository.getProfile(),
    repository.listProjects(),
    repository.listArticles(),
  ]);

  const featuredProjects = projects.filter((project) => project.featured);
  const featuredArticles = articles.filter((article) => article.featured);

  return (
    <main id="content">
      <section className="section hero">
        <div className="container hero-split fade-in">
          <div>
            <p className="eyebrow">
              {profile.headline} · {profile.location}
            </p>
            <h1 className="brand-mark">{profile.name}</h1>
            <p className="lead">{profile.bio}</p>
            <div className="hero-cta" style={{ marginTop: 28 }}>
              <Link className="btn btn-primary" href="/projects">
                Browse projects
              </Link>
              <Link className="btn btn-secondary btn-arrow" href="/about">
                About &amp; contact
              </Link>
            </div>
          </div>
          <SystemsDiagram />
        </div>
      </section>

      <section className="section">
        <div className="container stack fade-in delay-1" style={{ gap: 40 }}>
          <div
            className="row-between"
            style={{ alignItems: "end", flexWrap: "wrap", gap: 16 }}
          >
            <div style={{ maxWidth: "40ch" }}>
              <p className="eyebrow">Selected work</p>
              <h2>Flagship systems for a two-minute scan.</h2>
            </div>
            <Link className="btn btn-ghost btn-arrow" href="/projects">
              All projects
            </Link>
          </div>
          <div className="grid-2">
            {featuredProjects.map((project) => (
              <Link
                key={project.slug}
                className="card card-interactive work-card"
                href={`/projects/${project.slug}`}
              >
                <div className="kicker">
                  <span className="pill">
                    {project.eyebrow ?? "Case study"}
                  </span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="links">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredArticles.length > 0 ? (
        <section className="section">
          <div className="container fade-in delay-2">
            <div
              className="row-between"
              style={{
                alignItems: "end",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div style={{ maxWidth: "40ch" }}>
                <p className="eyebrow">Writing</p>
                <h2>Field reports from production work.</h2>
              </div>
              <Link className="btn btn-ghost btn-arrow" href="/articles">
                All articles
              </Link>
            </div>
            <div>
              {featuredArticles.map((article) => (
                <a
                  key={article.slug}
                  className="log-row"
                  href={article.url}
                  rel="noopener noreferrer"
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
                  </div>
                  <span className="meta pull">DEV →</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

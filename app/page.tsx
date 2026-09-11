import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ExternalLink";
import type { Project, ProjectSectionKind } from "@/domain/project";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: {
    absolute: "Michael Truong · AI engineering systems",
  },
  description:
    "Senior software engineer in Sydney. Browse production AI systems, editorial workflows, and field reports.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

function visualChannelId(index: number): string {
  return `CH ${String(index + 1).padStart(2, "0")}`;
}

function sectionText(
  project: Project,
  kinds: readonly ProjectSectionKind[],
): string {
  for (const kind of kinds) {
    const section = project.sections.find((item) => item.kind === kind);
    if (section?.body.trim()) {
      return section.body;
    }
  }
  return project.summary;
}

export default async function HomePage() {
  const repository = getPortfolioRepository();
  const [profile, projects, articles] = await Promise.all([
    repository.getProfile(),
    repository.listProjects(),
    repository.listArticles(),
  ]);

  const featuredProjects = projects.filter((project) => project.featured);
  const supportingProjects = projects.filter((project) => !project.featured);
  const featuredArticles = articles.filter((article) => article.featured);

  return (
    <main id="content" className="home">
      <section className="section hero hero-home">
        <div className="container fade-in">
          <p className="label">
            {profile.headline} / {profile.location}
          </p>
          <h1>Making uncertain systems dependable.</h1>
          <p className="lead">{profile.bio}</p>
          <div className="anchor-pair">
            {featuredProjects.map((project, index) => (
              <Link
                key={project.slug}
                className="anchor"
                href={`/projects/${project.slug}`}
              >
                <span>{project.title}</span>
                <span className="anchor-id">{visualChannelId(index)} →</span>
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
            {featuredProjects.map((project, index) => (
              <article key={project.slug} className="case-panel">
                <div className="case-head">
                  <span className="case-id">
                    {visualChannelId(index)} · {project.title}
                  </span>
                </div>
                <h3>
                  <Link href={`/projects/${project.slug}`}>
                    {project.summary}
                  </Link>
                </h3>
                <div className="spine">
                  <div>
                    <p className="label spine-term">Uncertain</p>
                    <p>
                      {sectionText(project, ["problem", "context", "system"])}
                    </p>
                  </div>
                  <div>
                    <p className="label spine-term">Made checkable</p>
                    <p>
                      {sectionText(project, [
                        "decisions",
                        "system",
                        "operation",
                      ])}
                    </p>
                  </div>
                  <div>
                    <p className="label spine-term">Contract</p>
                    <p className="contract">
                      {sectionText(project, ["constraints", "outcomes"])}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section fade-in delay-2">
        <div className="container two-col">
          <div>
            <h2 className="list-head">Supporting work</h2>
            {supportingProjects.map((project) => (
              <Link
                key={project.slug}
                className="list-row"
                href={`/projects/${project.slug}`}
              >
                <p className="list-row-title">{project.title}</p>
                <p>{project.summary}</p>
              </Link>
            ))}
            <p className="list-note">
              How these systems connect —{" "}
              <Link href="/ecosystem">ecosystem walkthrough →</Link>
            </p>
          </div>
          <div>
            <h2 className="list-head">Selected writing</h2>
            {featuredArticles.map((article) => (
              <ExternalLink
                key={article.slug}
                className="list-row"
                href={article.url}
                aria-label={article.title}
              >
                <p className="list-row-title">{article.title}</p>
                <p>{article.summary}</p>
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

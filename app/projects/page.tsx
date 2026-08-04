import type { Metadata } from "next";
import Link from "next/link";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Four interconnected systems: Codenames AI, AI-assisted editorial workflow, resume knowledge architecture, and Renovate governance.",
};

export default async function ProjectsPage() {
  const projects = await getPortfolioRepository().listProjects();

  return (
    <main id="content">
      <section className="section hero" style={{ paddingBottom: 32 }}>
        <div className="container fade-in" style={{ maxWidth: 720 }}>
          <p className="eyebrow">Projects</p>
          <h1>Work arranged as systems, not a résumé dump.</h1>
          <p className="lead" style={{ marginTop: 16 }}>
            Four case studies grounded in production evidence — product,
            editorial workflow, knowledge architecture, and dependency
            governance.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container fade-in delay-1">
          <div className="grid-2">
            {projects.map((project) => (
              <Link
                key={project.slug}
                className="card card-interactive work-card"
                href={`/projects/${project.slug}`}
              >
                <div className="kicker">
                  <span className="pill">
                    {project.eyebrow ?? "Case study"}
                  </span>
                  {project.kind ? (
                    <span className="meta">{project.kind}</span>
                  ) : null}
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="links">
                  {project.tags.slice(0, 4).map((tag) => (
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
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyToc } from "@/components/CaseStudyToc";
import { getPortfolioRepository } from "@/lib/portfolio";

type ProjectPageProps = PageProps<"/projects/[slug]">;

export async function generateStaticParams() {
  const projects = await getPortfolioRepository().listProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioRepository().getProject(slug);
  if (!project) {
    return { title: "Project not found" };
  }
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} · Michael Truong`,
      description: project.summary,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPortfolioRepository().getProject(slug);
  if (!project) notFound();

  const tocItems = [
    ...project.sections.map((section) => ({
      id: section.id,
      title: section.title,
    })),
    ...(project.relatedLinks?.length || project.evidence?.length
      ? [{ id: "related", title: "Related & evidence" }]
      : []),
  ];

  return (
    <main id="content">
      <section className="section hero" style={{ paddingBottom: 40 }}>
        <div className="container fade-in">
          <p className="meta" style={{ marginBottom: 12 }}>
            <Link href="/projects">Projects</Link> / {project.title}
          </p>
          {project.eyebrow ? (
            <p className="eyebrow">{project.eyebrow}</p>
          ) : null}
          <h1>{project.title}</h1>
          <p className="lead" style={{ marginTop: 16 }}>
            {project.summary}
          </p>
          <div className="project-hero-meta">
            {project.kind ? <span className="pill">{project.kind}</span> : null}
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid-1-2 fade-in delay-1">
          <aside className="case-study-aside">
            <CaseStudyToc items={tocItems} />
          </aside>
          <div>
            {project.sections.map((section) => (
              <div key={section.id} className="detail-block" id={section.id}>
                <h2>{section.title}</h2>
                <p
                  style={{
                    marginTop: 12,
                    color: "var(--muted)",
                    maxWidth: "62ch",
                  }}
                >
                  {section.body}
                </p>
              </div>
            ))}

            {(project.relatedLinks?.length || project.evidence?.length) && (
              <div className="detail-block" id="related">
                <h2>Related &amp; evidence</h2>
                {project.relatedLinks?.map((link) =>
                  link.url ? (
                    <a
                      key={link.id}
                      className="evidence-item"
                      href={link.url}
                      rel="noopener noreferrer"
                    >
                      <div>
                        <strong>{link.label}</strong>
                      </div>
                      <span className="meta">Open →</span>
                    </a>
                  ) : (
                    <div key={link.id} className="evidence-item">
                      <div>
                        <strong>{link.label}</strong>
                      </div>
                    </div>
                  ),
                )}
                {project.evidence?.map((item) =>
                  item.url ? (
                    <a
                      key={item.id}
                      className="evidence-item"
                      href={item.url}
                      rel="noopener noreferrer"
                    >
                      <div>
                        <strong>{item.label}</strong>
                      </div>
                      <span className="meta">Open →</span>
                    </a>
                  ) : (
                    <div key={item.id} className="evidence-item">
                      <div>
                        <strong>{item.label}</strong>
                        <p>Private / architecture evidence</p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

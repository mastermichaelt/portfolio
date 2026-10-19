import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyToc } from "@/components/CaseStudyToc";
import { CodenamesCaseExperience } from "@/components/projects/CodenamesCaseExperience";
import { ExternalLink } from "@/components/ExternalLink";
import { ProjectCaseDetail } from "@/components/ProjectCaseDetail";
import { SupportingCaseDetail } from "@/components/SupportingCaseDetail";
import {
  listCaseStudyParams,
  resolveCaseStudyEntry,
} from "@/lib/case-study-entry";
import { getPortfolioRepository } from "@/lib/portfolio";
import { openGraphForFileImageSegment } from "@/lib/social-metadata";

type ProjectPageProps = PageProps<"/projects/[slug]">;

export function generateStaticParams() {
  return listCaseStudyParams();
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await resolveCaseStudyEntry(slug);
  if (!entry) {
    return { title: "Project not found" };
  }

  const { name, description } =
    entry.kind === "case"
      ? { name: entry.projectCase.name, description: entry.projectCase.lead }
      : entry.kind === "supporting"
        ? {
            name: entry.supportingCase.name,
            description: entry.supportingCase.lead,
          }
        : { name: entry.project.title, description: entry.project.summary };
  const path = `/projects/${slug}`;
  return {
    title: name,
    description,
    alternates: {
      canonical: path,
    },
    // Image comes from the colocated opengraph-image / twitter-image files.
    openGraph: openGraphForFileImageSegment(path, {
      title: `${name} · Michael Truong`,
      description,
    }),
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const entry = await resolveCaseStudyEntry(slug);
  if (!entry) notFound();
  const repository = getPortfolioRepository();

  if (entry.kind === "case") {
    if (slug === "codenames-ai") {
      const experience = await repository.getCodenamesExperience();
      return <CodenamesCaseExperience experience={experience} />;
    }
    return <ProjectCaseDetail projectCase={entry.projectCase} />;
  }

  if (entry.kind === "supporting") {
    const entities = await repository.listEntities();
    return (
      <SupportingCaseDetail
        supportingCase={entry.supportingCase}
        workflowView={entry.workflowView}
        entities={entities}
      />
    );
  }

  const { project } = entry;
  const tocItems = [
    ...project.sections.map((section) => ({
      id: section.id,
      title: section.title,
    })),
    ...(project.relatedLinks?.length || project.evidence?.length
      ? [{ id: "links", title: "Links" }]
      : []),
  ];

  return (
    <main id="content">
      <section className="section hero hero-case">
        <div className="container fade-in">
          <p className="meta breadcrumb">
            <Link href="/projects">Projects</Link> / {project.title}
          </p>
          {project.eyebrow ? (
            <p className="eyebrow">{project.eyebrow}</p>
          ) : null}
          <h1>{project.title}</h1>
          <p className="lead lead-follow">{project.summary}</p>
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

      <section className="section section-flush">
        <div className="container grid-1-2 fade-in delay-1">
          <aside className="case-study-aside">
            <CaseStudyToc items={tocItems} />
          </aside>
          <div>
            {project.sections.map((section) => (
              <div key={section.id} className="detail-block" id={section.id}>
                <h2>{section.title}</h2>
                <p className="detail-body">{section.body}</p>
              </div>
            ))}

            {(project.relatedLinks?.length || project.evidence?.length) && (
              <div className="detail-block" id="links">
                <h2>Links</h2>
                {project.relatedLinks?.map((link) =>
                  link.url ? (
                    <ExternalLink
                      key={link.id}
                      className="evidence-item"
                      href={link.url}
                      aria-label={link.label}
                    >
                      <div>
                        <strong>{link.label}</strong>
                      </div>
                      <span className="meta">Open →</span>
                    </ExternalLink>
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
                    <ExternalLink
                      key={item.id}
                      className="evidence-item"
                      href={item.url}
                      aria-label={item.label}
                    >
                      <div>
                        <strong>{item.label}</strong>
                      </div>
                      <span className="meta">Open →</span>
                    </ExternalLink>
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

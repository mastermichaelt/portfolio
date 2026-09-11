import Link from "next/link";
import { CaseStudyRail, type RailItem } from "@/components/CaseStudyRail";
import { ExternalLink } from "@/components/ExternalLink";
import { QualifiedFigure } from "@/components/QualifiedFigure";
import { RichText } from "@/components/RichText";
import type { CaseArtifactRow, ProjectCase } from "@/domain/project-case";

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function ArtifactAffordance({ row }: { row: CaseArtifactRow }) {
  if (row.href) {
    if (isExternal(row.href)) {
      return (
        <ExternalLink
          className="pcase-affordance pcase-affordance-link"
          href={row.href}
        >
          Open →
        </ExternalLink>
      );
    }
    return (
      <Link className="pcase-affordance pcase-affordance-link" href={row.href}>
        Open →
      </Link>
    );
  }
  return <span className="pcase-affordance">{row.affordance}</span>;
}

/**
 * Co-primary case study (Projects 1C detail): a numbered evidence-block document
 * with a sticky contents rail, inheriting the index's three-column geometry so
 * the two surfaces read as one system. Server-rendered; the only client behavior
 * is the rail's scroll-spy.
 */
export function ProjectCaseDetail({
  projectCase,
}: {
  projectCase: ProjectCase;
}) {
  const railItems: RailItem[] = [
    ...projectCase.blocks.map((block) => ({
      id: block.id,
      ordinal: block.ordinal,
      navLabel: block.navLabel,
    })),
    { id: "artifacts", ordinal: "—", navLabel: "Artifacts" },
  ];

  return (
    <main id="content">
      <section className="pcase-head-section">
        <div className="container">
          <p className="meta pcase-breadcrumb">
            <Link href="/projects">Projects</Link> / {projectCase.name}
          </p>
          <div className="pcase-headgrid">
            <div>
              <p className="pcase-ch">{projectCase.channelLabel}</p>
              <p className="pcase-meta-lines">
                {projectCase.metaLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h1 className="pcase-title">{projectCase.title}</h1>
              <p className="lead pcase-lead">{projectCase.lead}</p>
            </div>
            <div className="pcase-aside-head">
              <p className="pcase-aside-label">{projectCase.aside.label}</p>
              <p className="pcase-aside-lines">
                {projectCase.aside.lines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
              <p className="pcase-aside-note">{projectCase.aside.note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-flush">
        <div className="container">
          <div className="pcase-shell">
            <CaseStudyRail
              items={railItems}
              elsewhere={projectCase.elsewhere}
            />

            <div className="pcase-blocks">
              {projectCase.blocks.map((block) => (
                <section key={block.id} id={block.id} className="pcase-block">
                  <div className="pcase-block-grid">
                    <div>
                      <div className="pcase-block-head">
                        <span className="pcase-ordinal">{block.ordinal}</span>
                        <span className="pcase-cat">{block.category}</span>
                      </div>
                      <h2 className="pcase-block-title">{block.heading}</h2>
                      {block.body.map((paragraph) => (
                        <p key={paragraph} className="pcase-block-body">
                          {paragraph}
                        </p>
                      ))}
                      <p className="pcase-contract">
                        <span className="pcase-contract-term">Contract:</span>{" "}
                        {block.contract}
                      </p>
                    </div>
                    <div className="pcase-block-gutter">
                      {block.figures ? (
                        <div className="pcase-figures">
                          {block.figures.map((figure) => (
                            <QualifiedFigure
                              key={figure.name}
                              figure={figure}
                            />
                          ))}
                        </div>
                      ) : block.note ? (
                        <div className="pcase-note">
                          <p className="pcase-note-label">{block.note.label}</p>
                          <div className="pcase-note-lines">
                            {block.note.lines.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                          <p className="pcase-note-closing">
                            {block.note.closing}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              ))}

              <section id="artifacts" className="pcase-block pcase-artifacts">
                <p className="pcase-artifacts-label">
                  {projectCase.artifacts.label}
                </p>
                {projectCase.artifacts.rows.map((row) => (
                  <div
                    key={row.id}
                    className={
                      row.labelMuted
                        ? "evidence-item pcase-artifact pcase-artifact--absence"
                        : "evidence-item pcase-artifact"
                    }
                  >
                    <div>
                      <strong>{row.label}</strong>
                      {row.description ? (
                        <p className="pcase-artifact-desc">
                          <RichText segments={row.description} />
                        </p>
                      ) : null}
                    </div>
                    <ArtifactAffordance row={row} />
                  </div>
                ))}
                <p className="pcase-artifacts-note">
                  <RichText segments={projectCase.artifacts.closing} />
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

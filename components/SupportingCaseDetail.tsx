import Link from "next/link";
import { CaseStudyRail, type RailItem } from "@/components/CaseStudyRail";
import { ExternalLink } from "@/components/ExternalLink";
import { ArchitectureFigure } from "@/components/projects/ArchitectureFigure";
import { RichText } from "@/components/RichText";
import type { CaseArtifactRow } from "@/domain/project-case";
import type { SupportingBlock, SupportingCase } from "@/domain/supporting-case";
import type { Entity } from "@/domain/entities";
import type { WorkflowView } from "@/domain/workflow-view";

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

function ProseBlock({
  block,
}: {
  block: Extract<SupportingBlock, { type: "prose" }>;
}) {
  return (
    <section id={block.id} className="pcase-block">
      <div className="pcase-block-grid">
        <div>
          <div className="pcase-block-head">
            <span className="pcase-ordinal">{block.ordinal}</span>
            <span className="pcase-cat">{block.category}</span>
          </div>
          <p className="pcase-block-lead">{block.lead}</p>
          {block.body.map((paragraph) => (
            <p key={paragraph} className="pcase-block-body">
              {paragraph}
            </p>
          ))}
          {block.contract ? (
            <p className="pcase-contract">
              <span className="pcase-contract-term">Contract:</span>{" "}
              {block.contract}
            </p>
          ) : null}
        </div>
        <div className="pcase-block-gutter">
          {block.note ? (
            <div className="pcase-note">
              <p className="pcase-note-label">{block.note.label}</p>
              <div className="pcase-note-lines">
                {block.note.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="pcase-note-closing">{block.note.closing}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * Supporting-tier case study: the co-primary evidence-block grammar with the
 * tier word in `--muted`, a static architecture figure immediately after
 * System, and no qualified figures. Server-rendered; the only client behaviour
 * is the rail scroll-spy and the figure's node selection.
 */
export function SupportingCaseDetail({
  supportingCase,
  workflowView,
  entities,
}: {
  supportingCase: SupportingCase;
  workflowView: WorkflowView;
  entities: Entity[];
}) {
  const railItems: RailItem[] = [
    ...supportingCase.blocks.map((block) => ({
      id: block.id,
      ordinal: block.ordinal,
      navLabel: block.navLabel,
    })),
    { id: "artifacts", ordinal: "—", navLabel: "Artifacts" },
  ];

  const blocks = supportingCase.blocks;

  return (
    <main id="content">
      <section className="pcase-head-section">
        <div className="container">
          <p className="meta pcase-breadcrumb">
            <Link href="/projects">Projects</Link> / {supportingCase.title}
          </p>
          <div className="pcase-headgrid">
            <div>
              <p className="pcase-tier">{supportingCase.header.tier}</p>
              <p className="pcase-meta-lines">
                {supportingCase.header.lines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h1 className="pcase-title">{supportingCase.title}</h1>
              <p className="lead pcase-lead">{supportingCase.lead}</p>
            </div>
            <div className="pcase-aside-head">
              <p className="pcase-aside-label">{supportingCase.aside.label}</p>
              <p className="pcase-aside-lines">
                {supportingCase.aside.lines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
              <p className="pcase-aside-note">{supportingCase.aside.note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-flush">
        <div className="container">
          <div className="pcase-shell">
            <CaseStudyRail
              items={railItems}
              elsewhere={supportingCase.elsewhere}
            />

            <div className="pcase-blocks">
              {blocks.map((block, index) => {
                if (block.type === "prose") {
                  return <ProseBlock key={block.id} block={block} />;
                }
                const next = blocks[index + 1];
                const forward = next
                  ? {
                      label: `Continue — ${next.ordinal} ${next.category} →`,
                      href: `#${next.id}`,
                    }
                  : { label: "Continue →", href: "#artifacts" };
                return (
                  <section
                    key={block.id}
                    id={block.id}
                    className="pcase-block pcase-arch-block"
                  >
                    <div className="pcase-block-head">
                      <span className="pcase-ordinal">{block.ordinal}</span>
                      <span className="pcase-cat">{block.category}</span>
                    </div>
                    <p className="pcase-arch-view-title">
                      {workflowView.title}
                    </p>
                    <p className="lead pcase-arch-view-summary">
                      {workflowView.summary}
                    </p>
                    {workflowView.talkTrack ? (
                      <p
                        className="pcase-arch-talk"
                        data-testid={`architecture-talk-track-${workflowView.id}`}
                      >
                        <span className="pcase-arch-talk-label">
                          Talk track
                        </span>
                        {workflowView.talkTrack}
                      </p>
                    ) : null}
                    <ArchitectureFigure
                      view={workflowView}
                      entities={entities}
                      figureNumber={block.ordinal}
                      provenance={block.provenance}
                      defaultSub={block.defaultSub}
                      defaultSummary={block.defaultSummary}
                      legendKinds={block.legendKinds}
                      forward={forward}
                    />
                  </section>
                );
              })}

              <section id="artifacts" className="pcase-block pcase-artifacts">
                <p className="pcase-artifacts-label">
                  {supportingCase.artifacts.label}
                </p>
                {supportingCase.artifacts.rows.map((row) => (
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
                  <RichText segments={supportingCase.artifacts.closing} />
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

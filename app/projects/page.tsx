import type { Metadata } from "next";
import Link from "next/link";
import { QualifiedFigure } from "@/components/QualifiedFigure";
import { RichText } from "@/components/RichText";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every system, and what it is allowed to claim. Two co-primary case studies — experiment measurement at Atlassian and Codenames AI — plus supporting systems, each stating its contract and qualified evidence.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    url: "/projects",
  },
};

export default async function ProjectsPage() {
  const index = await getPortfolioRepository().getProjectsIndex();

  return (
    <main id="content">
      <section className="pindex-hero-section">
        <div className="container">
          <div className="pindex-hero fade-in">
            <div>
              <p className="label pindex-eyebrow">{index.hero.eyebrow}</p>
              <h1 className="pindex-heading">{index.hero.title}</h1>
              <p className="lead pindex-lead">{index.hero.lead}</p>
            </div>
            <div className="pindex-key">
              <p className="pindex-key-label">{index.key.label}</p>
              <div className="pindex-key-lines">
                {index.key.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pindex-table-section">
        <div className="container">
          <div
            className="pindex-table fade-in delay-1"
            role="table"
            aria-label="Projects evidence index"
          >
            <div className="pindex-head" role="row">
              <span role="columnheader" id="pindex-col-system">
                {index.columns.system}
              </span>
              <span role="columnheader" id="pindex-col-contract">
                {index.columns.contract}
              </span>
              <span role="columnheader" id="pindex-col-evidence">
                {index.columns.evidence}
              </span>
            </div>

            {index.coPrimary.map((row) => (
              <article
                key={row.href}
                className="pindex-row pindex-row--co"
                role="row"
                aria-label={`Co-primary: ${row.title}`}
              >
                <div
                  className="pindex-col-system"
                  role="cell"
                  aria-labelledby="pindex-col-system"
                >
                  <p className="pindex-ch">{row.channelLabel}</p>
                  <p className="pindex-sys">{row.title}</p>
                  <p className="pindex-era">
                    {row.org}
                    <br />
                    {row.dateRange}
                  </p>
                  <Link className="pindex-open" href={row.href}>
                    Open →
                  </Link>
                </div>
                <div
                  className="pindex-col-contract"
                  role="cell"
                  aria-labelledby="pindex-col-contract"
                >
                  <h2 className="pindex-contract">{row.contract}</h2>
                  <p className="pindex-summary">{row.summary}</p>
                  <div className="pindex-chips">
                    {row.chips.map((chip) => (
                      <span key={chip} className="pindex-chip">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <p className="pindex-rolespine">{row.roleSpine}</p>
                </div>
                <div
                  className="pindex-col-evidence"
                  role="cell"
                  aria-labelledby="pindex-col-evidence"
                >
                  <div className="pindex-figures">
                    {row.figures.map((figure) => (
                      <QualifiedFigure key={figure.name} figure={figure} />
                    ))}
                  </div>
                  <p className="pindex-defer">
                    <RichText segments={row.deferral} />
                  </p>
                </div>
              </article>
            ))}

            {index.supporting.map((row) => (
              <Link
                key={row.href}
                className="pindex-row pindex-row--support"
                href={row.href}
                aria-label={`Supporting: ${row.title}`}
              >
                <div className="pindex-col-system">
                  <p className="pindex-tier">Supporting</p>
                  <p className="pindex-sys pindex-sys--support">{row.title}</p>
                </div>
                <p className="pindex-support-body">{row.summary}</p>
                <p className="pindex-proof">{row.proofSurface}</p>
              </Link>
            ))}

            {index.infrastructure.map((row) => (
              <div
                key={row.title}
                className="pindex-row pindex-row--infra"
                role="row"
                aria-label={`Infrastructure: ${row.title}`}
              >
                <div
                  className="pindex-col-system"
                  role="cell"
                  aria-labelledby="pindex-col-system"
                >
                  <p className="pindex-tier">Infrastructure</p>
                  <p className="pindex-sys pindex-sys--infra">{row.title}</p>
                </div>
                <p
                  className="pindex-support-body pindex-support-body--infra"
                  role="cell"
                  aria-labelledby="pindex-col-contract"
                >
                  {row.summary}
                </p>
                <p
                  className="pindex-proof"
                  role="cell"
                  aria-labelledby="pindex-col-evidence"
                >
                  {row.proofSurface}
                </p>
              </div>
            ))}

            <p className="pindex-footer">
              <RichText segments={index.footer} />
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

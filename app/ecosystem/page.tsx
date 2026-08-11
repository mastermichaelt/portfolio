import type { Metadata } from "next";
import Link from "next/link";
import type { Entity, EntityKind } from "@/domain/entities";
import { EcosystemExplorer } from "@/components/ecosystem/EcosystemExplorer";
import { ExternalLink } from "@/components/ExternalLink";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "Read-only canvases for AI engineering systems — light layer-spine overview plus operational workflow walkthroughs.",
  alternates: {
    canonical: "/ecosystem",
  },
  openGraph: {
    url: "/ecosystem",
  },
};

const KIND_ORDER: EntityKind[] = [
  "project",
  "workflow",
  "agent",
  "skill",
  "governance",
  "knowledge",
  "output",
  "integration",
];

function kindLabel(kind: EntityKind): string {
  switch (kind) {
    case "project":
      return "Projects";
    case "workflow":
      return "Workflows";
    case "agent":
      return "Agents";
    case "skill":
      return "Skills";
    case "governance":
      return "Governance";
    case "knowledge":
      return "Knowledge";
    case "output":
      return "Outputs";
    case "integration":
      return "Integrations";
  }
}

function groupEntitiesByKind(entities: Entity[]): Map<EntityKind, Entity[]> {
  const groups = new Map<EntityKind, Entity[]>();
  for (const kind of KIND_ORDER) {
    groups.set(kind, []);
  }
  for (const entity of entities) {
    const bucket = groups.get(entity.kind);
    if (bucket) {
      bucket.push(entity);
    }
  }
  return groups;
}

export default async function EcosystemPage() {
  const repository = getPortfolioRepository();
  const [workflowViews, entities] = await Promise.all([
    repository.listWorkflowViews(),
    repository.listEntities(),
  ]);
  const entitiesByKind = groupEntitiesByKind(entities);

  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container container-narrow fade-in">
          <p className="eyebrow">Ecosystem</p>
          <h1>How the systems connect.</h1>
          <p className="lead lead-follow">
            A light orientation spine plus three operational workflow canvases
            for interview walkthroughs. Pan, zoom, and select a node to open the
            detail panel — read-only, no mega-graph of every entity.
          </p>
        </div>
      </section>

      <section className="section section-flush">
        <div className="container fade-in delay-1">
          <EcosystemExplorer
            workflowViews={workflowViews}
            entities={entities}
          />
        </div>
      </section>

      <section className="section">
        <div className="container fade-in delay-2 stack">
          <div className="row-between section-heading section-heading-spaced">
            <div>
              <p className="eyebrow">Entity inventory</p>
              <h2>Knowledge model by kind</h2>
              <p className="lead lead-follow">
                Text index of the same entities for scanning — not rendered as a
                full relationship graph.
              </p>
            </div>
          </div>
          {KIND_ORDER.map((kind) => {
            const group = entitiesByKind.get(kind) ?? [];
            if (group.length === 0) return null;
            return (
              <div key={kind}>
                <h3>{kindLabel(kind)}</h3>
                <div className="grid-2">
                  {group.map((entity) => (
                    <article key={entity.id} className="card work-card">
                      <div className="kicker">
                        <span className="pill">{entity.kind}</span>
                        {entity.relatedProjectSlug ? (
                          <Link
                            className="meta text-link"
                            href={`/projects/${entity.relatedProjectSlug}`}
                          >
                            {entity.relatedProjectSlug}
                          </Link>
                        ) : null}
                      </div>
                      <h3>{entity.name}</h3>
                      <p>{entity.summary}</p>
                      {entity.evidence && entity.evidence.length > 0 ? (
                        <div className="links">
                          {entity.evidence.map((item) =>
                            item.url ? (
                              <ExternalLink
                                key={item.id}
                                className="text-link"
                                href={item.url}
                              >
                                {item.label}
                              </ExternalLink>
                            ) : (
                              <span key={item.id} className="meta">
                                {item.label}
                              </span>
                            ),
                          )}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

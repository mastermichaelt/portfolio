import type { Metadata } from "next";
import Link from "next/link";
import type { Entity, EntityKind } from "@/domain/entities";
import { ExternalLink } from "@/components/ExternalLink";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "Text index of AI engineering systems — curated workflow views and an entity inventory for interview walkthroughs.",
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
            A readable index of curated workflow views and the underlying entity
            inventory. Interactive canvases ship in a later slice — this route
            stays unlinked from primary nav until then.
          </p>
        </div>
      </section>

      <section className="section section-flush">
        <div className="container fade-in delay-1">
          <div className="row-between section-heading">
            <div>
              <p className="eyebrow">Workflow views</p>
              <h2>Stories to walk through</h2>
            </div>
          </div>
          <div className="grid-2">
            {workflowViews.map((view) => (
              <article key={view.id} className="card work-card" id={view.id}>
                <div className="kicker">
                  <span className="pill">{view.id}</span>
                  <span className="meta">{view.nodes.length} nodes</span>
                </div>
                <h3>{view.title}</h3>
                <p>{view.summary}</p>
                <div className="tag-row">
                  {view.nodes.map((node) => (
                    <span key={node.id} className="tag">
                      {node.label}
                      {node.subtitle ? ` — ${node.subtitle}` : ""}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container fade-in delay-2 stack">
          <div className="row-between section-heading section-heading-spaced">
            <div>
              <p className="eyebrow">Entity inventory</p>
              <h2>Knowledge model by kind</h2>
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

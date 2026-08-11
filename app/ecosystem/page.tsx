import type { Metadata } from "next";
import { EcosystemEntityInventory } from "@/components/ecosystem/EcosystemEntityInventory";
import { EcosystemExplorer } from "@/components/ecosystem/EcosystemExplorer";
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

export default async function EcosystemPage() {
  const repository = getPortfolioRepository();
  const [workflowViews, entities] = await Promise.all([
    repository.listWorkflowViews(),
    repository.listEntities(),
  ]);

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
                Filter the same entities by kind for scanning — not rendered as
                a full relationship graph.
              </p>
            </div>
          </div>
          <EcosystemEntityInventory entities={entities} />
        </div>
      </section>
    </main>
  );
}

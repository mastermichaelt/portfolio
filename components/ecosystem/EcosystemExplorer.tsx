"use client";

import { useState } from "react";

import { EcosystemCanvas } from "@/components/ecosystem/EcosystemCanvas";
import { EcosystemDetailPanel } from "@/components/ecosystem/EcosystemDetailPanel";
import type { Entity } from "@/domain/entities";
import type { WorkflowView } from "@/domain/workflow-view";
import {
  partitionWorkflowViews,
  resolveEcosystemDetail,
} from "@/lib/ecosystem-canvas";

type EcosystemExplorerProps = {
  workflowViews: WorkflowView[];
  entities: Entity[];
};

type Selection = {
  viewId: string;
  nodeId: string;
} | null;

export function EcosystemExplorer({
  workflowViews,
  entities,
}: EcosystemExplorerProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const { overview, operational } = partitionWorkflowViews(workflowViews);
  const entitiesById = new Map(
    entities.map((entity) => [entity.id, entity] as const),
  );

  const detail = selection
    ? resolveEcosystemDetail({
        views: workflowViews,
        entitiesById,
        viewId: selection.viewId,
        nodeId: selection.nodeId,
      })
    : null;

  const handleSelectNode = (viewId: string, nodeId: string | null) => {
    if (!nodeId) {
      setSelection(null);
      return;
    }
    setSelection({ viewId, nodeId });
  };

  return (
    <div className="ecosystem-shell">
      <div className="ecosystem-main stack stack-feature">
        {overview ? (
          <section
            className="ecosystem-view"
            id={overview.id}
            aria-labelledby={`${overview.id}-title`}
          >
            <div className="section-heading section-heading-spaced">
              <div>
                <p className="eyebrow">Orientation</p>
                <h2 id={`${overview.id}-title`}>{overview.title}</h2>
                <p className="lead lead-follow">{overview.summary}</p>
              </div>
            </div>
            <EcosystemCanvas
              view={overview}
              selectedNodeId={
                selection?.viewId === overview.id ? selection.nodeId : null
              }
              onSelectNode={handleSelectNode}
              compact
            />
          </section>
        ) : null}

        {operational.map((view) => (
          <section
            key={view.id}
            className="ecosystem-view"
            id={view.id}
            aria-labelledby={`${view.id}-title`}
          >
            <div className="section-heading section-heading-spaced">
              <div>
                <p className="eyebrow">Operational workflow</p>
                <h2 id={`${view.id}-title`}>{view.title}</h2>
                <p className="lead lead-follow">{view.summary}</p>
              </div>
            </div>
            <EcosystemCanvas
              view={view}
              selectedNodeId={
                selection?.viewId === view.id ? selection.nodeId : null
              }
              onSelectNode={handleSelectNode}
            />
          </section>
        ))}
      </div>
      <EcosystemDetailPanel detail={detail} />
    </div>
  );
}

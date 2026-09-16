"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { EcosystemCanvas } from "@/components/ecosystem/EcosystemCanvas";
import { EcosystemDetailPanel } from "@/components/ecosystem/EcosystemDetailPanel";
import type { Entity } from "@/domain/entities";
import type { WorkflowView } from "@/domain/workflow-view";
import {
  nextEcosystemSelection,
  resolveEcosystemDetail,
  type EcosystemDetailModel,
  type EcosystemSelection,
} from "@/lib/ecosystem-canvas";

const NARROW_MAX = "(max-width: 920px)";

type ProjectWorkflowDiagramProps = {
  view: WorkflowView;
  entities: Entity[];
  projectSlug: string;
};

function InlineDetailSlot({
  active,
  detail,
  panelRef,
  currentProjectSlug,
}: {
  active: boolean;
  detail: EcosystemDetailModel | null;
  panelRef: RefObject<HTMLDivElement | null>;
  currentProjectSlug: string;
}) {
  if (!active) return null;
  return (
    <div
      ref={panelRef}
      className="ecosystem-panel-inline"
      data-testid="ecosystem-detail-inline"
    >
      <EcosystemDetailPanel
        detail={detail}
        currentProjectSlug={currentProjectSlug}
      />
    </div>
  );
}

export function ProjectWorkflowDiagram({
  view,
  entities,
  projectSlug,
}: ProjectWorkflowDiagramProps) {
  const [selection, setSelection] = useState<EcosystemSelection>(null);
  const [narrow, setNarrow] = useState(false);
  const inlinePanelRef = useRef<HTMLDivElement | null>(null);
  const entitiesById = new Map(
    entities.map((entity) => [entity.id, entity] as const),
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW_MAX);
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.defaultPrevented) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      setSelection((current) => (current ? null : current));
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const detail = selection
    ? resolveEcosystemDetail({
        views: [view],
        entitiesById,
        viewId: selection.viewId,
        nodeId: selection.nodeId,
      })
    : null;

  useEffect(() => {
    if (!narrow || !selection) return;
    inlinePanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [narrow, selection]);

  const handleSelectNode = (viewId: string, nodeId: string | null) => {
    setSelection((current) => nextEcosystemSelection(current, viewId, nodeId));
  };

  const selectedNodeId =
    selection?.viewId === view.id ? selection.nodeId : null;

  return (
    <div className={`ecosystem-shell${narrow ? " is-narrow" : ""}`}>
      <div className="ecosystem-main">
        <div className="section-heading section-heading-spaced">
          <div>
            <p className="eyebrow">Operational workflow</p>
            <h2>{view.title}</h2>
            <p className="lead lead-follow">{view.summary}</p>
            {view.talkTrack ? (
              <p
                className="ecosystem-talk-track"
                data-testid={`ecosystem-talk-track-${view.id}`}
              >
                <span className="eyebrow">Talk track</span>
                {view.talkTrack}
              </p>
            ) : null}
          </div>
        </div>
        <EcosystemCanvas
          view={view}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
        />
        {narrow ? (
          <InlineDetailSlot
            active
            detail={detail}
            panelRef={inlinePanelRef}
            currentProjectSlug={projectSlug}
          />
        ) : null}
      </div>
      {!narrow ? (
        <div className="ecosystem-panel-side">
          <EcosystemDetailPanel
            detail={detail}
            currentProjectSlug={projectSlug}
          />
        </div>
      ) : null}
    </div>
  );
}

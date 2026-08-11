"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { EcosystemCanvas } from "@/components/ecosystem/EcosystemCanvas";
import { EcosystemDetailPanel } from "@/components/ecosystem/EcosystemDetailPanel";
import type { Entity } from "@/domain/entities";
import type { WorkflowView } from "@/domain/workflow-view";
import {
  ecosystemViewIdFromHash,
  focusEcosystemViewSection,
  nextEcosystemSelection,
  partitionWorkflowViews,
  resolveEcosystemDetail,
  type EcosystemDetailModel,
  type EcosystemSelection,
} from "@/lib/ecosystem-canvas";

const NARROW_MAX = "(max-width: 920px)";

type EcosystemExplorerProps = {
  workflowViews: WorkflowView[];
  entities: Entity[];
};

type ViewSectionProps = {
  view: WorkflowView;
  eyebrow: string;
  compact?: boolean;
  selectedNodeId: string | null;
  onSelectNode: (viewId: string, nodeId: string | null) => void;
  inlinePanel: ReactNode;
};

function EcosystemViewSection({
  view,
  eyebrow,
  compact = false,
  selectedNodeId,
  onSelectNode,
  inlinePanel,
}: ViewSectionProps) {
  return (
    <section
      className="ecosystem-view"
      id={view.id}
      tabIndex={-1}
      aria-labelledby={`${view.id}-title`}
    >
      <div className="section-heading section-heading-spaced">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${view.id}-title`}>{view.title}</h2>
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
        onSelectNode={onSelectNode}
        compact={compact}
      />
      {inlinePanel}
    </section>
  );
}

function InlineDetailSlot({
  active,
  detail,
  panelRef,
}: {
  active: boolean;
  detail: EcosystemDetailModel | null;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  if (!active) return null;
  return (
    <div
      ref={panelRef}
      className="ecosystem-panel-inline"
      data-testid="ecosystem-detail-inline"
    >
      <EcosystemDetailPanel detail={detail} />
    </div>
  );
}

export function EcosystemExplorer({
  workflowViews,
  entities,
}: EcosystemExplorerProps) {
  const [selection, setSelection] = useState<EcosystemSelection>(null);
  const [narrow, setNarrow] = useState(false);
  const inlinePanelRef = useRef<HTMLDivElement | null>(null);
  const { overview, operational } = partitionWorkflowViews(workflowViews);
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
    const ids = workflowViews.map((view) => view.id);
    const applyHash = () => {
      const viewId = ecosystemViewIdFromHash(window.location.hash, ids);
      if (!viewId) return;
      // Wait a frame so layout/fitView settle before scrolling.
      window.requestAnimationFrame(() => {
        focusEcosystemViewSection(viewId);
      });
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [workflowViews]);

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

    // Capture so Escape clears even when a focused React Flow node handles it.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const detail = selection
    ? resolveEcosystemDetail({
        views: workflowViews,
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

  const selectedFor = (viewId: string) =>
    selection?.viewId === viewId ? selection.nodeId : null;

  const inlineFor = (viewId: string, fallbackWhenEmpty = false) => {
    if (!narrow) return null;
    const active =
      selection?.viewId === viewId || (!selection && fallbackWhenEmpty);
    return (
      <InlineDetailSlot
        active={active}
        detail={detail}
        panelRef={inlinePanelRef}
      />
    );
  };

  return (
    <div className={`ecosystem-shell${narrow ? " is-narrow" : ""}`}>
      <div className="ecosystem-main stack stack-feature">
        {overview ? (
          <EcosystemViewSection
            view={overview}
            eyebrow="Orientation"
            compact
            selectedNodeId={selectedFor(overview.id)}
            onSelectNode={handleSelectNode}
            inlinePanel={inlineFor(overview.id, true)}
          />
        ) : null}

        {operational.map((view) => (
          <EcosystemViewSection
            key={view.id}
            view={view}
            eyebrow="Operational workflow"
            selectedNodeId={selectedFor(view.id)}
            onSelectNode={handleSelectNode}
            inlinePanel={inlineFor(view.id)}
          />
        ))}
      </div>
      {!narrow ? (
        <div className="ecosystem-panel-side">
          <EcosystemDetailPanel detail={detail} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import {
  ArchitectureDetailStrip,
  type StripSelection,
} from "@/components/projects/ArchitectureDetailStrip";
import { ArchitectureStack } from "@/components/projects/ArchitectureStack";
import type { Entity } from "@/domain/entities";
import type { WorkflowView } from "@/domain/workflow-view";
import {
  buildFigureGeometry,
  fitScale,
  narrowLayoutFor,
  ordinalFor,
} from "@/lib/architecture-figure";
import { resolveEcosystemDetail } from "@/lib/ecosystem-canvas";

// useLayoutEffect measures before paint on the client; fall back to useEffect on
// the server (where it is a no-op) to avoid the SSR warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface ArchitectureForwardLink {
  label: string;
  href: string;
}

export interface ArchitectureFigureProps {
  view: WorkflowView;
  entities: Entity[];
  /** Figure number, matching the architecture block's ordinal (e.g. "04"). */
  figureNumber: string;
  provenance: string;
  /** Detail-strip census shown when no node is selected. */
  defaultSub: string;
  defaultSummary: string;
  /** The one legend line naming this diagram's kinds. */
  legendKinds: string;
  forward: ArchitectureForwardLink;
}

export function ArchitectureFigure({
  view,
  entities,
  figureNumber,
  provenance,
  defaultSub,
  defaultSummary,
  legendKinds,
  forward,
}: ArchitectureFigureProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Geometry, narrow layout and entity index are pure functions of the
  // immutable view/entities. Memoize so selection toggles and ResizeObserver
  // fit-scale updates re-render without rebuilding edge routing or the index.
  const geometry = useMemo(() => buildFigureGeometry(view), [view]);
  const narrowRows = useMemo(() => narrowLayoutFor(view), [view]);
  const entitiesById = useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity] as const)),
    [entities],
  );
  const markerId = `arch-arrow-${view.id}`;

  // Fit the wide artboard to the real architecture column: measure the canvas
  // frame with a ResizeObserver (the column is container-dependent, not a media
  // query) and scale the whole artboard uniformly. Only a horizontal scrollbar
  // can appear on the frame, so the measured content width is stable.
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const frameWidth = frame.clientWidth;
      // Skip while the frame is display:none (the <=740px stack is showing) so
      // the last wide scale is retained rather than collapsing to the floor.
      if (frameWidth === 0) return;
      const next = fitScale(frameWidth, geometry.width);
      setScale((prev) => (Math.abs(prev - next) > 0.0005 ? next : prev));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [geometry.width]);

  const renderedWidth = geometry.width * scale;
  const renderedHeight = geometry.height * scale;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
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
      setSelectedNodeId((current) => (current ? null : current));
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const toggle = (nodeId: string) =>
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId));

  const clearOnGround = (event: MouseEvent) => {
    const el = event.target as HTMLElement;
    if (!el.closest("[data-node]")) setSelectedNodeId(null);
  };

  const detail = selectedNodeId
    ? resolveEcosystemDetail({
        views: [view],
        entitiesById,
        viewId: view.id,
        nodeId: selectedNodeId,
      })
    : null;

  const selection: StripSelection | null =
    detail && selectedNodeId
      ? {
          kind: detail.kind,
          ordinal: ordinalFor(view, selectedNodeId),
          label: detail.label,
          subtitle: detail.subtitle,
          summary: detail.summary,
          evidence: detail.evidence,
        }
      : null;

  return (
    <div
      className="pcase-arch"
      role="group"
      aria-label={`${view.title} — architecture figure`}
    >
      <div className="pcase-arch-head">
        <span>
          Fig. {figureNumber} — {view.id}
        </span>
        <span>
          {view.nodes.length} nodes · {view.edges.length} edges · {provenance}
        </span>
      </div>

      {/* Wide figure — the intrinsic artboard fitted to the frame by a uniform
          scale (never > 1, floored at 0.80). The sizing box carries the rendered
          dimensions so block height and the frame's scroll width follow the
          figure, not its intrinsic size. Replaced by the stack at <=740px. */}
      <div
        className="pcase-arch-canvas"
        ref={frameRef}
        onClick={clearOnGround}
        role="presentation"
      >
        <div
          className="pcase-arch-sizer"
          style={{ width: renderedWidth, height: renderedHeight }}
        >
          <div
            className="pcase-arch-artboard"
            style={{
              width: geometry.width,
              height: geometry.height,
              transform: `scale(${scale})`,
            }}
          >
            <svg
              width={geometry.width}
              height={geometry.height}
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              className="pcase-arch-svg"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id={markerId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0,1 L9,5 L0,9 z" className="pcase-arch-arrowhead" />
                </marker>
              </defs>
              {geometry.edges.map((edge) => (
                <path
                  key={edge.id}
                  d={edge.d}
                  className={
                    "pcase-arch-edge" + (edge.dashed ? " is-dashed" : "")
                  }
                  markerEnd={`url(#${markerId})`}
                />
              ))}
            </svg>

            {geometry.edges.map((edge) =>
              edge.label && edge.labelX != null && edge.labelY != null ? (
                <span
                  key={`l-${edge.id}`}
                  className="pcase-arch-edge-label"
                  style={{ left: edge.labelX, top: edge.labelY }}
                  aria-hidden="true"
                >
                  {edge.label}
                </span>
              ) : null,
            )}

            {geometry.nodes.map((node) => {
              const selected = node.id === selectedNodeId;
              return (
                <button
                  key={node.id}
                  type="button"
                  data-node={node.id}
                  aria-pressed={selected}
                  className={
                    "pcase-arch-node pcase-arch-canvas-node" +
                    (selected ? " is-selected" : "")
                  }
                  style={{ left: node.left, top: node.top }}
                  onClick={() => toggle(node.id)}
                >
                  <span className="pcase-arch-node-head">
                    <span className="pcase-arch-node-kind">{node.kind}</span>
                    <span className="pcase-arch-node-ord">{node.ordinal}</span>
                  </span>
                  <span className="pcase-arch-node-label">{node.label}</span>
                  {node.subtitle ? (
                    <span className="pcase-arch-node-sub">{node.subtitle}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Narrow stack — the same nodes and edges, replacing the canvas below 740px. */}
      <ArchitectureStack
        rows={narrowRows}
        nodes={geometry.nodes}
        selectedNodeId={selectedNodeId}
        onSelect={toggle}
      />

      <ArchitectureDetailStrip
        selection={selection}
        defaultSub={defaultSub}
        defaultSummary={defaultSummary}
      />

      <div className="pcase-arch-legend">
        <span>
          <span className="pcase-arch-legend-line" aria-hidden="true" />
          Default path
        </span>
        <span>
          <span
            className="pcase-arch-legend-line is-dashed"
            aria-hidden="true"
          />
          Conditional / optional path
        </span>
        <span>Labels state the condition on that edge</span>
        <span>{legendKinds}</span>
      </div>

      <div className="pcase-arch-return">
        <a href="#content" className="pcase-arch-return-back">
          ↑ Back to contents
        </a>
        <a href={forward.href} className="pcase-arch-return-fwd">
          {forward.label}
        </a>
      </div>
    </div>
  );
}

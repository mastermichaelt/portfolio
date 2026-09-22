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
import { ArchitectureTrace } from "@/components/projects/ArchitectureTrace";
import type { Entity } from "@/domain/entities";
import type { WorkflowView } from "@/domain/workflow-view";
import {
  buildFigureGeometry,
  buildTrace,
  fitScale,
  ordinalFor,
  prefersTrace,
} from "@/lib/architecture-figure";
import {
  resolveEcosystemDetail,
  type EcosystemDetailModel,
} from "@/lib/ecosystem-canvas";

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

  // Geometry, trace and entity index are pure functions of the immutable
  // view/entities. Memoize so selection toggles and ResizeObserver width updates
  // re-render without rebuilding edge routing, the derived trace or the index.
  const geometry = useMemo(() => buildFigureGeometry(view), [view]);
  const traceRows = useMemo(() => buildTrace(view), [view]);
  const entitiesById = useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity] as const)),
    [entities],
  );
  const markerId = `arch-arrow-${view.id}`;

  // One measured source of width drives both derived presentation values. The
  // architecture column is container-dependent (not a media query), so the
  // figure measures its own frame with a ResizeObserver. `frameWidth` starts at
  // the intrinsic width so SSR and the client's first render both compute the
  // artboard (isWide, scale 1) — no hydration mismatch — and the pre-paint
  // layout effect then corrects to the trace on a narrow column with no flash.
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(geometry.width);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const next = frame.clientWidth;
      // Skip a zero-width read (a hidden frame) so the last real width is kept.
      if (next === 0) return;
      setFrameWidth((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const isWide = !prefersTrace(frameWidth, view);
  const scale = useMemo(
    () => fitScale(frameWidth, geometry.width),
    [frameWidth, geometry.width],
  );
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

  // Resolve every node's detail once, so the trace knows which nodes actually
  // have expandable content (a summary or evidence) and the strip reads the
  // selected node from the same source. A node with neither is not an expandable
  // control in the trace — we never fabricate copy just to keep expansion open.
  const detailById = useMemo(() => {
    const map = new Map<string, EcosystemDetailModel>();
    for (const node of view.nodes) {
      const resolved = resolveEcosystemDetail({
        views: [view],
        entitiesById,
        viewId: view.id,
        nodeId: node.id,
      });
      if (resolved) map.set(node.id, resolved);
    }
    return map;
  }, [view, entitiesById]);

  const traceExpandableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, resolved] of detailById) {
      if (resolved.summary || resolved.evidence.length > 0) ids.add(id);
    }
    return ids;
  }, [detailById]);

  const detail = selectedNodeId
    ? (detailById.get(selectedNodeId) ?? null)
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

  // The strip's census instruction, shortened into the trace's single hint line.
  const traceHint = `${defaultSub}. Select one to read its summary and evidence; press it again, or Escape, to close.`;

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

      {/* One figure, two presentations. The frame is measured in both so the
          ResizeObserver can detect the column growing back above the threshold.
          Above the threshold: the intrinsic artboard fitted by a uniform scale
          (never > 1, floored at 0.80), with the persistent detail strip below.
          Below it: the same nodes and edges as the vertical spine trace, and no
          strip — the artboard is not rendered at all, so nothing scrolls
          sideways. The switch is frameWidth < intrinsic × MIN_FIGURE_SCALE. */}
      <div
        className={"pcase-arch-canvas" + (isWide ? "" : " is-trace")}
        ref={frameRef}
        onClick={isWide ? clearOnGround : undefined}
        role="presentation"
      >
        {isWide ? (
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
                    <path
                      d="M0,1 L9,5 L0,9 z"
                      className="pcase-arch-arrowhead"
                    />
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
                      <span className="pcase-arch-node-ord">
                        {node.ordinal}
                      </span>
                    </span>
                    <span className="pcase-arch-node-label">{node.label}</span>
                    {node.subtitle ? (
                      <span className="pcase-arch-node-sub">
                        {node.subtitle}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <ArchitectureTrace
            rows={traceRows}
            viewId={view.id}
            hint={traceHint}
            selectedNodeId={selectedNodeId}
            selectedSummary={detail?.summary}
            selectedEvidence={detail?.evidence ?? []}
            expandableIds={traceExpandableIds}
            onSelect={toggle}
          />
        )}
      </div>

      {isWide ? (
        <ArchitectureDetailStrip
          selection={selection}
          defaultSub={defaultSub}
          defaultSummary={defaultSummary}
        />
      ) : null}

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

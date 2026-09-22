import { ExternalLink } from "@/components/ExternalLink";
import type { Evidence } from "@/domain/evidence";
import type {
  TraceConnectorRow,
  TraceNodeRow,
  TraceRow,
} from "@/lib/architecture-figure";

/**
 * The narrow architecture trace — a vertical spine that replaces the artboard
 * below its viability threshold. The same nodes and edges as the artboard,
 * derived once by buildTrace, render as a rail with a dashed branch lane, loop
 * bracket and visible convergence, with inline node expansion instead of the
 * persistent detail strip. Topology (branch, bypass, rejoin, loop, ordering,
 * kind, edge conditions) stays recoverable; no authored copy is duplicated.
 */
export function ArchitectureTrace({
  rows,
  viewId,
  hint,
  selectedNodeId,
  selectedSummary,
  selectedEvidence,
  expandableIds,
  onSelect,
}: {
  rows: TraceRow[];
  viewId: string;
  hint: string;
  selectedNodeId: string | null;
  selectedSummary?: string;
  selectedEvidence: Evidence[];
  /** Node ids that have expandable content (a summary or evidence). */
  expandableIds: Set<string>;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <>
      <p className="pcase-arch-trace-hint">{hint}</p>
      <div className="pcase-arch-trace">
        {rows.map((row, index) =>
          row.type === "node" ? (
            <NodeRow
              key={row.nodeId}
              row={row}
              viewId={viewId}
              expandable={expandableIds.has(row.nodeId)}
              expanded={
                expandableIds.has(row.nodeId) && row.nodeId === selectedNodeId
              }
              summary={selectedSummary}
              evidence={selectedEvidence}
              onSelect={onSelect}
            />
          ) : (
            <ConnectorRow key={`c-${index}`} row={row} />
          ),
        )}
      </div>
    </>
  );
}

function NodeRow({
  row,
  viewId,
  expandable,
  expanded,
  summary,
  evidence,
  onSelect,
}: {
  row: TraceNodeRow;
  viewId: string;
  expandable: boolean;
  expanded: boolean;
  summary?: string;
  evidence: Evidence[];
  onSelect: (nodeId: string) => void;
}) {
  const panelId = `arch-${viewId}-${row.nodeId}`;
  const head = (
    <span className="pcase-arch-trace-node-head">
      <span className="pcase-arch-trace-ord">{row.ordinal}</span>
      <span className="pcase-arch-trace-label">{row.label}</span>
      {row.showKind ? (
        <span className="pcase-arch-trace-chip">{row.kind}</span>
      ) : null}
      {expanded ? <span className="pcase-arch-trace-close">Close</span> : null}
    </span>
  );

  const evidenceLinks = evidence.filter(
    (item): item is Evidence & { url: string } => !!item.url,
  );

  return (
    <div
      className={
        "pcase-arch-trace-row is-node" + (row.onLane ? " is-lane" : "")
      }
    >
      <span className="pcase-arch-trace-rail" aria-hidden="true">
        <span className="pcase-arch-trace-rail-main" />
        <span className="pcase-arch-trace-rail-lane" />
        <span className="pcase-arch-trace-rail-tick" />
      </span>
      <span className="pcase-arch-trace-content">
        {expandable ? (
          <div
            className={
              "pcase-arch-trace-card" + (expanded ? " is-expanded" : "")
            }
          >
            <button
              type="button"
              data-node={row.nodeId}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="pcase-arch-trace-node"
              onClick={() => onSelect(row.nodeId)}
            >
              {head}
            </button>
            {/* The controlled panel renders whenever the node is expanded, so
                aria-controls always resolves — even for a node made expandable
                by evidence alone. Summary and evidence are conditional within
                it; the node is expandable only when it has at least one, so the
                panel is never empty and nothing is fabricated. Topology
                (branch, rejoin, loop) stays with the connector rows. */}
            {expanded ? (
              <div id={panelId} className="pcase-arch-trace-panel">
                {summary ? (
                  <span className="pcase-arch-trace-summary">{summary}</span>
                ) : null}
                {evidenceLinks.map((item) => (
                  <ExternalLink
                    key={item.id}
                    className="pcase-arch-trace-evlink"
                    href={item.url}
                  >
                    {item.label}
                  </ExternalLink>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          // No summary and no evidence — nothing to expand, so the card is a
          // plain identity row, not an interactive control.
          <div
            data-node={row.nodeId}
            className="pcase-arch-trace-node is-static"
          >
            {head}
          </div>
        )}
      </span>
    </div>
  );
}

function ConnectorRow({ row }: { row: TraceConnectorRow }) {
  return (
    <div
      className={
        "pcase-arch-trace-row is-" + row.kind + (row.text ? "" : " is-bare")
      }
    >
      <span className="pcase-arch-trace-rail" aria-hidden="true">
        <span className="pcase-arch-trace-rail-main" />
        <span className="pcase-arch-trace-rail-lane" />
        <span className="pcase-arch-trace-rail-cross" />
      </span>
      <span className="pcase-arch-trace-content">
        {row.text ? (
          <span className="pcase-arch-trace-connector">
            {row.kind === "loop" ? (
              <span className="pcase-arch-trace-bracket" aria-hidden="true" />
            ) : null}
            <span>{row.text}</span>
          </span>
        ) : null}
      </span>
    </div>
  );
}

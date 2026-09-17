import type { FigureNodeBox, NarrowRow } from "@/lib/architecture-figure";

/**
 * The narrow (<=740px) architecture stack. Nodes render full width in ordinal
 * order; every non-default edge becomes a labelled connector row. The canvas is
 * replaced, never scaled — no node, edge, branch, bypass or loop is dropped.
 */
export function ArchitectureStack({
  rows,
  nodes,
  selectedNodeId,
  onSelect,
}: {
  rows: NarrowRow[];
  nodes: FigureNodeBox[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
}) {
  const nodeById = new Map(nodes.map((node) => [node.id, node] as const));

  return (
    <div className="pcase-arch-stack" data-testid="architecture-stack">
      {rows.map((row, index) => {
        if (row.type === "connector") {
          const arrow = row.arrow === "up" ? "↑" : "↓";
          return (
            <p
              key={`c-${index}`}
              className={
                "pcase-arch-stack-connector" +
                (row.dashed ? " is-dashed" : "") +
                (row.indent ? " is-indent" : "")
              }
            >
              {row.text ? `${arrow} ${row.text}` : arrow}
            </p>
          );
        }
        const node = nodeById.get(row.nodeId);
        if (!node) return null;
        const selected = node.id === selectedNodeId;
        return (
          <button
            key={node.id}
            type="button"
            data-node={node.id}
            aria-pressed={selected}
            className={
              "pcase-arch-node pcase-arch-stack-node" +
              (selected ? " is-selected" : "") +
              (row.indent ? " is-indent" : "")
            }
            onClick={() => onSelect(node.id)}
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
  );
}

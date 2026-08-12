"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { EcosystemNodeData } from "@/lib/ecosystem-canvas";

export type EcosystemFlowNode = Node<EcosystemNodeData, "ecosystem">;

export function EcosystemNode({
  data,
  selected,
}: NodeProps<EcosystemFlowNode>) {
  return (
    <div
      className={`ecosystem-node${selected ? " is-selected" : ""}`}
      data-kind={data.kind}
    >
      {/* Default left→right flow uses `in` / `out`. Extra handles keep
          reverse and branch edges from stacking on the same corridor. */}
      <Handle
        className="ecosystem-handle"
        type="target"
        position={Position.Left}
        id="in"
        isConnectable={false}
      />
      <Handle
        className="ecosystem-handle"
        type="target"
        position={Position.Top}
        id="in-top"
        isConnectable={false}
      />
      <Handle
        className="ecosystem-handle"
        type="target"
        position={Position.Bottom}
        id="in-bottom"
        isConnectable={false}
      />
      <span className="pill ecosystem-node-kind">{data.kind}</span>
      <strong className="ecosystem-node-label">{data.label}</strong>
      {data.subtitle ? (
        <span className="meta ecosystem-node-subtitle">{data.subtitle}</span>
      ) : null}
      <Handle
        className="ecosystem-handle"
        type="source"
        position={Position.Right}
        id="out"
        isConnectable={false}
      />
      <Handle
        className="ecosystem-handle"
        type="source"
        position={Position.Top}
        id="out-top"
        isConnectable={false}
      />
      <Handle
        className="ecosystem-handle"
        type="source"
        position={Position.Bottom}
        id="out-bottom"
        isConnectable={false}
      />
    </div>
  );
}

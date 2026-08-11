"use client";

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import { useMemo } from "react";

import { EcosystemNode } from "@/components/ecosystem/EcosystemNode";
import {
  toEcosystemFlowEdges,
  toEcosystemFlowNodes,
  type EcosystemNodeData,
} from "@/lib/ecosystem-canvas";
import type { WorkflowView } from "@/domain/workflow-view";

import "@xyflow/react/dist/style.css";

const nodeTypes = {
  ecosystem: EcosystemNode,
} satisfies NodeTypes;

type EcosystemCanvasProps = {
  view: WorkflowView;
  selectedNodeId: string | null;
  onSelectNode: (viewId: string, nodeId: string | null) => void;
  compact?: boolean;
};

function EcosystemCanvasInner({
  view,
  selectedNodeId,
  onSelectNode,
  compact = false,
}: EcosystemCanvasProps) {
  // Fully parent-controlled graph: no useNodesState/setNodes effects.
  // Those sync loops were the React #185 source when multiple canvases updated.
  // Avoid onSelectionChange: each canvas keeps a stale RF selection store, and
  // syncing it fights parent-owned selection across multiple canvases.
  // ariaRole:button lets Enter/Space synthesize click → onNodeClick.
  const nodes: Node<EcosystemNodeData>[] = useMemo(
    () =>
      toEcosystemFlowNodes(view).map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
        ariaRole: "button",
      })),
    [view, selectedNodeId],
  );
  const edges: Edge[] = useMemo(() => toEcosystemFlowEdges(view), [view]);

  return (
    <div
      className={`ecosystem-canvas${compact ? " ecosystem-canvas-compact" : ""}`}
      data-testid={`ecosystem-canvas-${view.id}`}
      data-view-id={view.id}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_event, node) => {
          if (node.id === selectedNodeId) return;
          onSelectNode(view.id, node.id);
        }}
        onPaneClick={() => {
          if (selectedNodeId) onSelectNode(view.id, null);
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable
        elementsSelectable
        edgesFocusable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        panOnScroll
        zoomOnPinch
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        defaultMarkerColor="var(--ecosystem-edge-stroke, #8a847c)"
        proOptions={{ hideAttribution: true }}
        aria-label={`${view.title} canvas`}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function EcosystemCanvas(props: EcosystemCanvasProps) {
  return (
    <ReactFlowProvider>
      <EcosystemCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

"use client";

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import { useEffect } from "react";

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
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<EcosystemNodeData>
  >(toEcosystemFlowNodes(view));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    toEcosystemFlowEdges(view),
  );

  // Keep node/edge structure in sync with the view, without rewriting selection
  // every time (selection is applied in a separate, change-gated effect).
  useEffect(() => {
    setNodes(toEcosystemFlowNodes(view));
    setEdges(toEcosystemFlowEdges(view));
  }, [view, setNodes, setEdges]);

  // Apply external selection without recreating nodes when flags already match.
  // Recreating selected nodes from onSelectionChange caused React #185 when
  // switching between multiple canvases (programmatic deselect ↔ parent state).
  useEffect(() => {
    setNodes((current) => {
      let changed = false;
      const next = current.map((node) => {
        const selected = node.id === selectedNodeId;
        if ((node.selected ?? false) === selected) return node;
        changed = true;
        return { ...node, selected };
      });
      return changed ? next : current;
    });
  }, [selectedNodeId, setNodes]);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_event, node) => {
          if (node.id === selectedNodeId) return;
          onSelectNode(view.id, node.id);
        }}
        onPaneClick={() => {
          if (selectedNodeId) onSelectNode(view.id, null);
        }}
        nodesDraggable={false}
        nodesConnectable={false}
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

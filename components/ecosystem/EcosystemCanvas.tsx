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
  type OnSelectionChangeParams,
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

  useEffect(() => {
    setNodes(
      toEcosystemFlowNodes(view).map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    );
    setEdges(toEcosystemFlowEdges(view));
  }, [view, selectedNodeId, setNodes, setEdges]);

  const handleSelectionChange = ({
    nodes: selectedNodes,
  }: OnSelectionChangeParams) => {
    const nextId = selectedNodes[0]?.id ?? null;
    if (nextId === selectedNodeId) return;
    onSelectNode(view.id, nextId);
  };

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
        onSelectionChange={handleSelectionChange}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        edgesFocusable={false}
        panOnScroll
        zoomOnPinch
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
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

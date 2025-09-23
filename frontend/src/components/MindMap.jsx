import React, { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
} from "reactflow";
import "reactflow/dist/style.css";

const defaultNodes = [
  {
    id: "1",
    data: { label: "No mind map generated yet" },
    position: { x: 250, y: 100 },
    style: {
      background: "#f8d7da",
      color: "#721c24",
      border: "1px solid #f5c6cb",
      padding: 10,
      borderRadius: 8,
    },
  },
];

const defaultEdges = [];

const MindMap = ({ data }) => {
  const nodes = data?.nodes && Array.isArray(data.nodes) && data.nodes.length > 0
    ? data.nodes.map((n) => ({
        ...n,
        style: {
          background: "#e3f2fd",
          border: "1px solid #90caf9",
          borderRadius: 8,
          padding: 10,
          fontSize: 14,
          ...n.style,
        },
      }))
    : defaultNodes;

  const edges = data?.edges && Array.isArray(data.edges) ? data.edges : defaultEdges;

  const onNodeClick = useCallback((_, node) => {
    alert(`Node clicked: ${node.data.label}`);
  }, []);

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={onNodeClick}
      >
        <MiniMap
          nodeStrokeColor={(n) => (n.style?.background ? n.style.background : "#000")}
          nodeColor={(n) => n.style?.background || "#fff"}
        />
        <Controls />
        <Background color="#f0f0f0" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default MindMap;

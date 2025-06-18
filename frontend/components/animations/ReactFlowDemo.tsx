"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Globe, Code, Zap } from "lucide-react";

// Custom Node Component
function CustomNode({ data }: { data: any }) {
  const getIcon = () => {
    switch (data.type) {
      case "gmail":
        return <Mail className="w-4 h-4" />;
      case "slack":
        return <MessageSquare className="w-4 h-4" />;
      case "webhook":
        return <Globe className="w-4 h-4" />;
      case "code":
        return <Code className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (data.type) {
      case "gmail":
        return "from-red-500 to-pink-500";
      case "slack":
        return "from-purple-500 to-indigo-500";
      case "webhook":
        return "from-green-500 to-teal-500";
      case "code":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-blue-500 to-cyan-500";
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div className={`absolute -inset-1 bg-gradient-to-r ${getColor()} rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300`}></div>
      <div className="relative px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg shadow-lg min-w-[120px]">
        <div className="flex items-center gap-2 text-white">
          {getIcon()}
          <span className="font-medium text-sm">{data.label}</span>
        </div>
        {data.subtitle && (
          <div className="text-xs text-gray-400 mt-1">{data.subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 50, y: 50 },
    data: { 
      label: "Gmail Trigger", 
      type: "gmail",
      subtitle: "New email received"
    },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 50, y: 200 },
    data: { 
      label: "Process Data", 
      type: "code",
      subtitle: "Extract key info"
    },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 300, y: 125 },
    data: { 
      label: "Send to Slack", 
      type: "slack",
      subtitle: "Notify team"
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#8b5cf6", strokeWidth: 2 },
  },
];

export function ReactFlowDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isAnimating, setIsAnimating] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Animation sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // Reset after animation
      setTimeout(() => setIsAnimating(false), 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#374151"
        />
        <Controls 
          className="bg-gray-800 border-gray-700"
          showInteractive={false}
        />
        
        {/* Floating text overlay */}
        <div className="absolute top-4 left-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"
          >
            <div className="text-white text-sm font-medium">
              AI Generated Workflow
            </div>
            <div className="text-gray-400 text-xs">
              Gmail → Process → Slack
            </div>
          </motion.div>
        </div>

        {/* Animation indicator */}
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 z-10 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2 text-green-300 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Executing...
            </div>
          </motion.div>
        )}
      </ReactFlow>
    </div>
  );
}

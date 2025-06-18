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
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, Globe, Code, Zap, Database, Filter } from "lucide-react";

// Custom Node Component
function CustomNode({ data, selected }: { data: any; selected?: boolean }) {
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
      case "database":
        return <Database className="w-4 h-4" />;
      case "filter":
        return <Filter className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (data.type) {
      case "gmail":
        return "from-white/30 to-white/20";
      case "slack":
        return "from-white/35 to-white/25";
      case "webhook":
        return "from-white/25 to-white/15";
      case "code":
        return "from-white/40 to-white/30";
      case "database":
        return "from-white/30 to-white/20";
      case "filter":
        return "from-white/35 to-white/25";
      default:
        return "from-white/20 to-white/10";
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
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-white/70 !border-2 !border-white"
      />
      
      <div className={`absolute -inset-1 bg-gradient-to-r ${getColor()} rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300`}></div>
      <div className={`relative px-3 py-2 bg-black/80 border-2 rounded-lg shadow-lg min-w-[100px] ${
        selected ? 'border-white/60' : 'border-white/30'
      }`}>
        <div className="flex items-center gap-2 text-white text-sm">
          {getIcon()}
          <span className="font-medium">{data.label}</span>
        </div>
        {data.subtitle && (
          <div className="text-xs text-gray-400 mt-1">{data.subtitle}</div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-white/70 !border-2 !border-white"
      />
    </motion.div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

const demoWorkflows = [
  {
    nodes: [
      {
        id: "1",
        type: "custom",
        position: { x: 50, y: 50 },
        data: { 
          label: "Gmail", 
          type: "gmail",
          subtitle: "New email"
        },
      },
      {
        id: "2",
        type: "custom",
        position: { x: 50, y: 160 },
        data: { 
          label: "Filter", 
          type: "filter",
          subtitle: "Check subject"
        },
      },
      {
        id: "3",
        type: "custom",
        position: { x: 250, y: 105 },
        data: { 
          label: "Slack", 
          type: "slack",
          subtitle: "Send message"
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#ffffff80", strokeWidth: 2 },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#ffffff60", strokeWidth: 2 },
      },
    ],
    description: "Gmail → Filter → Slack"
  },
  {
    nodes: [
      {
        id: "1",
        type: "custom",
        position: { x: 30, y: 30 },
        data: { 
          label: "Webhook", 
          type: "webhook",
          subtitle: "API trigger"
        },
      },
      {
        id: "2",
        type: "custom",
        position: { x: 30, y: 130 },
        data: { 
          label: "Code", 
          type: "code",
          subtitle: "Process data"
        },
      },
      {
        id: "3",
        type: "custom",
        position: { x: 180, y: 80 },
        data: { 
          label: "Database", 
          type: "database",
          subtitle: "Save record"
        },
      },
      {
        id: "4",
        type: "custom",
        position: { x: 320, y: 80 },
        data: { 
          label: "Slack", 
          type: "slack",
          subtitle: "Notify team"
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#ffffff70", strokeWidth: 2 },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#ffffff60", strokeWidth: 2 },
      },
      {
        id: "e3-4",
        source: "3",
        target: "4",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#ffffff50", strokeWidth: 2 },
      },
    ],
    description: "API → Process → Save → Notify"
  }
];

const demoMessages = [
  "Send Slack notification when I get important emails",
  "Process webhook data and save to database",
  "Create automated customer onboarding flow"
];

export function ReactFlowDemo() {
  const [currentWorkflow, setCurrentWorkflow] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(demoWorkflows[0].nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(demoWorkflows[0].edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Cycle through demo workflows
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWorkflow((prev) => (prev + 1) % demoWorkflows.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update nodes and edges when workflow changes
  useEffect(() => {
    const workflow = demoWorkflows[currentWorkflow];
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
  }, [currentWorkflow, setNodes, setEdges]);

  // Simulate AI generation animation
  useEffect(() => {
    const messageInterval = setInterval(() => {
      const messageIndex = Math.floor(Date.now() / 6000) % demoMessages.length;
      const message = demoMessages[messageIndex];
      
      setIsGenerating(true);
      setShowWorkflow(false);
      setCurrentMessage("");
      
      // Type out message
      let i = 0;
      const typeInterval = setInterval(() => {
        setCurrentMessage(message.slice(0, i));
        i++;
        if (i > message.length) {
          clearInterval(typeInterval);
          // Show workflow after typing
          setTimeout(() => {
            setIsGenerating(false);
            setShowWorkflow(true);
          }, 1000);
        }
      }, 50);
    }, 6000);

    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden bg-black relative border border-white/20">
      {/* Input simulation overlay */}
      <AnimatePresence>
        {!showWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="max-w-md w-full mx-4">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-gray-400 text-sm mb-2">Describe your workflow:</div>
                <div className="bg-black/60 rounded border border-white/20 p-3 min-h-[50px] flex items-center">
                  <span className="text-white">{currentMessage}</span>
                  <span className="w-0.5 h-5 bg-white/70 ml-1 animate-pulse"></span>
                </div>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 text-white/70 text-sm"
                  >
                    <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></div>
                    Generating workflow...
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        style={{ backgroundColor: 'transparent' }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#ffffff20"
        />
        <Controls 
          className="bg-black/80 border-white/20"
          showInteractive={false}
          showFitView={false}
        />
        
        {/* Workflow description */}
        <div className="absolute top-3 left-3 z-10">
          <motion.div
            key={currentWorkflow}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"
          >
            <div className="text-white text-sm font-medium">
              AI Generated
            </div>
            <div className="text-gray-400 text-xs">
              {demoWorkflows[currentWorkflow].description}
            </div>
          </motion.div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1"
          >
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <div className="w-2 h-2 bg-white/70 rounded-full"></div>
              Ready to Export
            </div>
          </motion.div>
        </div>

        {/* Workflow indicators */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex gap-2">
            {demoWorkflows.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentWorkflow 
                    ? 'bg-white/70 w-6' 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}

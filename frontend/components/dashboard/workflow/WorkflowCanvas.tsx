"use client";

import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Workflow } from '@/hooks/useWorkflows';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowActions } from './WorkflowActions';
import { EmptyCanvas } from './EmptyCanvas';
import { convertN8NToReactFlow, autoLayoutNodes, getWorkflowCenter } from '@/lib/utils/workflowConverter';

interface WorkflowCanvasProps {
  workflow: Workflow | null;
}

export function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isValidatingWorkflow, setIsValidatingWorkflow] = useState(false);

  // Convert N8N workflow to React Flow format when workflow changes
  useEffect(() => {
    if (workflow?.workflow) {
      const { nodes: flowNodes, edges: flowEdges } = convertN8NToReactFlow(workflow.workflow);
      
      // If nodes don't have positions, auto-layout them
      const nodesWithLayout = flowNodes.some(node => !node.position.x && !node.position.y) 
        ? autoLayoutNodes(flowNodes)
        : flowNodes;
      
      setNodes(nodesWithLayout);
      setEdges(flowEdges);

      // Center the view on the workflow (you'll need to implement this with useReactFlow)
      const center = getWorkflowCenter(nodesWithLayout);
      // TODO: Use react-flow's fitView or setCenter when available
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleTestWorkflow = async () => {
    if (!workflow || nodes.length === 0) return;
    
    setIsValidatingWorkflow(true);
    try {
      // TODO: Replace with your testing API
      const response = await fetch('/api/workflows/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          nodes,
          edges
        })
      });
      
      if (!response.ok) throw new Error('Test failed');
      
      const result = await response.json();
      console.log('Test result:', result);
      
    } catch (error) {
      console.error('Workflow test error:', error);
    } finally {
      setIsValidatingWorkflow(false);
    }
  };

  const handleExportWorkflow = () => {
    if (!workflow?.workflow) return;
    
    // Get the original N8N workflow data
    const originalWorkflow = workflow.workflow;
    
    // Start with the original N8N workflow as the base
    const exportData = {
      ...originalWorkflow,
      // Update nodes with any changes from React Flow
      nodes: nodes.map(node => ({
        ...originalWorkflow.nodes.find(n => n.id === node.id), // Get original N8N node data
        position: [node.position.x, node.position.y], // Update position from React Flow
      })),
      // Convert React Flow edges back to N8N connections format
      connections: edges.reduce((acc, edge) => {
        const sourceName = nodes.find(n => n.id === edge.source)?.data.label;
        const targetName = nodes.find(n => n.id === edge.target)?.data.label;
        
        if (!sourceName || !targetName) return acc;
        
        if (!acc[sourceName]) {
          acc[sourceName] = { main: [[]] };
        }
        
        acc[sourceName].main[0].push({
          node: targetName,
          type: 'main',
          index: 0
        });
        
        return acc;
      }, {} as Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }>)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveWorkflow = async () => {
    if (!workflow?.workflow) return;
    
    try {
      // Get the original N8N workflow data
      const originalWorkflow = workflow.workflow;

      // Convert current state back to N8N format for saving
      const updatedWorkflow = {
        ...originalWorkflow,
        nodes: nodes.map(node => ({
          ...originalWorkflow.nodes.find(n => n.id === node.id),
          position: [node.position.x, node.position.y],
        }))
      };

      await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: updatedWorkflow })
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (!workflow) {
    return (
      <div className="flex-1 h-full bg-black/60 relative">
        <EmptyCanvas />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-black/60 relative">
      <WorkflowToolbar workflow={workflow} />
      
      <div className="h-full pt-14">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          className="bg-transparent"
          nodesDraggable
          nodesConnectable
          elementsSelectable
          snapToGrid
          snapGrid={[15, 15]}
          fitView
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#333333"
          />
          <Controls 
            className="bg-black/90 border border-white/20 rounded-lg"
            showZoom
            showFitView
            showInteractive
          />
          <MiniMap 
            className="bg-black/90 border border-white/20 rounded-lg"
            nodeColor="#6b7280"
            maskColor="rgba(0, 0, 0, 0.9)"
          />
        </ReactFlow>
      </div>

      <WorkflowActions
        workflow={workflow}
        onTest={handleTestWorkflow}
        onExport={handleExportWorkflow}
        onSave={handleSaveWorkflow}
        isValidatingWorkflow={isValidatingWorkflow}
      />
    </div>
  );
}

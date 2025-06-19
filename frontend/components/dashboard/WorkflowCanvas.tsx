"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
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
import { Workflow, GeneratedWorkflow } from '@/hooks/useWorkflows';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowActions } from './WorkflowActions';
import { EmptyCanvas } from './EmptyCanvas';

interface WorkflowCanvasProps {
  workflow: Workflow | GeneratedWorkflow | null;
}

export function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [isTestingWorkflow, setIsTestingWorkflow] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleTestWorkflow = async () => {
    if (!workflow || nodes.length === 0) return;
    
    setIsTestingWorkflow(true);
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
      setIsTestingWorkflow(false);
    }
  };

  const handleExportWorkflow = () => {
    if (!workflow) return;
    
    const exportData = {
      name: workflow.name,
      description: workflow.description || '',
      nodes: nodes,
      connections: edges.map(edge => ({
        node: edge.source,
        type: 'main',
        index: 0
      })),
      settings: {},
      staticData: null,
      tags: [],
      triggerCount: 0,
      meta: {
        templateCredsSetupCompleted: true
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveWorkflow = async () => {
    if (!workflow) return;
    
    try {
      // TODO: Replace with your save API
      await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
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
        isTestingWorkflow={isTestingWorkflow}
      />
    </div>
  );
}

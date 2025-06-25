"use client";

import { useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Workflow } from '@/types/workflow';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowActions } from './WorkflowActions';
import { EmptyCanvas } from './EmptyCanvas';
import { N8nNode } from './nodes/N8nNode';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ValidationStatus } from './components/ValidationStatus';
import { WorkflowError } from './components/WorkflowError';
import { useWorkflowValidation, useWorkflowOperations, useReactFlowManagement } from './hooks';

const nodeTypes = {
  n8nNode: N8nNode,
};

interface WorkflowCanvasProps {
  workflow: Workflow | null;
  isLoading?: boolean;
  onWorkflowUpdate?: (workflow: Workflow) => void;
  onOpenChat?: () => void;
  onCreateNew?: () => void;
}

function WorkflowCanvasContent({ workflow, isLoading, onOpenChat, onCreateNew }: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    workflowLoadError,
    setWorkflowLoadError,
  } = useReactFlowManagement(workflow);

  const {
    validationStatus,
    validationMessage,
    isValidating,
    validateWorkflowNodes,
  } = useWorkflowValidation();

  const {
    isExporting,
    exportWorkflow,
  } = useWorkflowOperations();

  const handleTestWorkflow = () => validateWorkflowNodes(nodes);
  const handleExportWorkflow = () => exportWorkflow(workflow!, nodes, edges);

  const reactFlowProps = useMemo(() => ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    className: "bg-transparent",
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    snapToGrid: true,
    snapGrid: [20, 20] as [number, number],
    fitView: false,
    minZoom: 0.05,
    maxZoom: 2,
    defaultViewport: { x: 0, y: 0, zoom: 0.8 },
    connectionLineType: 'smoothstep' as const,
    connectionMode: 'loose' as const,
  }), [nodes, edges, onNodesChange, onEdgesChange, onConnect]);

  if (workflowLoadError) {
    return (
      <div className="flex-1 h-full bg-black/60 relative">
        <WorkflowError error={workflowLoadError} onRetry={() => setWorkflowLoadError(null)} />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex-1 h-full bg-black/60 relative">
        <EmptyCanvas onOpenChat={onOpenChat} onCreateNew={onCreateNew} />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-black/60 relative">
      <WorkflowToolbar workflow={workflow} />
      <ValidationStatus status={validationStatus} message={validationMessage} />
      
      <div className="h-full pt-14">
        <LoadingOverlay isVisible={isLoading || false} message="Loading workflow..." />
        
        <ReactFlow 
          {...reactFlowProps} 
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          connectionLineStyle={{ 
            stroke: '#ffffff60', 
            strokeWidth: 3,
            strokeDasharray: '5,5'
          }}
          defaultEdgeOptions={{
            style: { 
              stroke: '#ffffff80', 
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))',
            },
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: 'arrow',
              color: '#ffffff80',
              width: 16,
              height: 16,
            },
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1.5} 
            color="#333333"
          />
          <Controls 
            className="bg-black/90 border border-white/20 rounded-lg"
            showZoom
            showFitView
            showInteractive
          />
          <MiniMap 
            className="!bg-transparent border border-white/20 rounded-lg"
            nodeColor="#6b7280"
            maskColor="rgba(0, 0, 0, 0.9)"
            color="rgba(0,0,0,0.6)"
            ariaLabel={null}
          />
        </ReactFlow>
      </div>

      <WorkflowActions
        workflow={workflow}
        onTest={handleTestWorkflow}
        onExport={handleExportWorkflow}
        isValidatingWorkflow={isValidating}
        isExporting={isExporting}
        validationStatus={validationStatus}
      />
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}

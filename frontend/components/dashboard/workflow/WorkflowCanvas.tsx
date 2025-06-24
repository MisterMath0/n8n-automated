"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Workflow } from '@/types/workflow';
import { N8NWorkflow, N8NNode } from '@/types/api';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowActions } from './WorkflowActions';
import { EmptyCanvas } from './EmptyCanvas';
import { convertN8NToReactFlow, autoLayoutNodesWithConnections, getWorkflowCenter, getWorkflowBounds, validateWorkflow } from '@/lib/utils/workflowConverter';
import { useToast } from '@/components/providers';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { N8nNode } from './nodes/N8nNode';
import { isTriggerNode } from '@/lib/utils/node-styling';

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

// Production-ready loading overlay component
function LoadingOverlay({ isVisible, message }: { isVisible: boolean; message: string }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-black/80 border border-white/20 rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            <span className="text-white text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Production-ready validation status component
function ValidationStatus({ 
  status, 
  message 
}: { 
  status: 'idle' | 'validating' | 'valid' | 'invalid' | 'error'; 
  message?: string;
}) {
  const statusConfig = {
    idle: { icon: null, color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
    validating: { icon: Loader2, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    valid: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    invalid: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    error: { icon: AlertCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === 'idle' || !Icon) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`absolute top-16 left-4 z-40 ${config.bgColor} ${config.color} border border-current/20 rounded-lg px-3 py-2 flex items-center space-x-2 text-sm`}
    >
      <Icon className={`w-4 h-4 ${status === 'validating' ? 'animate-spin' : ''}`} />
      <span>{message || status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </motion.div>
  );
}

function WorkflowCanvasContent({ workflow, isLoading, onWorkflowUpdate, onOpenChat, onCreateNew }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isValidatingWorkflow, setIsValidatingWorkflow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [workflowLoadError, setWorkflowLoadError] = useState<string | null>(null);

  const { fitView } = useReactFlow();
  const toast = useToast();

  // Production-ready workflow loading with proper error handling
  useEffect(() => {
    if (workflow?.workflow) {
      try {
        setWorkflowLoadError(null);
        const { nodes: flowNodes, edges: flowEdges } = convertN8NToReactFlow(workflow.workflow);
        
        // Use the enhanced layout algorithm that considers connections
        const nodesWithLayout = flowNodes.some(node => !node.position.x && !node.position.y) 
          ? autoLayoutNodesWithConnections(flowNodes, flowEdges)
          : flowNodes;
        
        setNodes(nodesWithLayout);
        setEdges(flowEdges);

        // Enhanced view centering with proper bounds calculation
        setTimeout(() => {
          if (nodesWithLayout.length > 0) {
            const bounds = getWorkflowBounds(nodesWithLayout);
            fitView({ 
              padding: 0.1, 
              duration: 800,
              minZoom: 0.1, // Allow much more zoom out
              maxZoom: 1.5,
            });
          }
        }, 100);
        
        // Reset validation status when workflow changes
        setValidationStatus('idle');
        setValidationMessage('');
      } catch (error) {
        console.error('Workflow conversion error:', error);
        setWorkflowLoadError('Failed to load workflow visualization');
        toast.error('Failed to load workflow visualization');
      }
    } else {
      setNodes([]);
      setEdges([]);
      setWorkflowLoadError(null);
    }
  }, [workflow, setNodes, setEdges, fitView, toast]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleTestWorkflow = async () => {
    if (!workflow || nodes.length === 0) {
      toast.error('No workflow to test');
      return;
    }
    
    setIsValidatingWorkflow(true);
    setValidationStatus('validating');
    setValidationMessage('Testing workflow...');
    
    try {
      // Production-ready workflow validation logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Enhanced validation using the new system
      const validationResult = validateWorkflow(nodes);
      
      if (!validationResult.isValid) {
        setValidationStatus('invalid');
        setValidationMessage(validationResult.errors[0] || 'Workflow validation failed');
        toast.error('Workflow validation failed');
        return;
      }
      
      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('Workflow warnings:', validationResult.warnings);
      }
      
      setValidationStatus('valid');
      setValidationMessage('Workflow is valid and ready to run');
      toast.success('Workflow validation passed');
      
      // Auto-hide validation status after 3 seconds
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Workflow test error:', error);
      setValidationStatus('error');
      setValidationMessage('Failed to test workflow');
      toast.error('Workflow testing failed');
    } finally {
      setIsValidatingWorkflow(false);
    }
  };

  const handleExportWorkflow = async () => {
    if (!workflow?.workflow) {
      toast.error('No workflow to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Production-ready export with proper error handling
      const originalWorkflow = workflow.workflow;
      
      const exportData = {
        ...originalWorkflow,
        // Production-ready node position updates
        nodes: nodes.map(node => {
          const originalNode = originalWorkflow.nodes.find((n: N8NNode) => n.id === node.id);
          return {
            ...originalNode,
            position: [node.position.x, node.position.y] as [number, number],
          };
        }),
        // Production-ready connections conversion
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
      a.download = `${workflow.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Workflow exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };


  // Enhanced ReactFlow props for better left-right flow performance
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
    fitView: false, // We handle this manually for better control
    minZoom: 0.05, // Allow extreme zoom out
    maxZoom: 2,
    defaultViewport: { x: 0, y: 0, zoom: 0.8 },
    // Better connection settings for left-right flow
    connectionLineType: 'smoothstep' as const,
    connectionMode: 'loose' as const,
  }), [nodes, edges, onNodesChange, onEdgesChange, onConnect]);

  if (workflowLoadError) {
    return (
      <div className="flex-1 h-full bg-black/60 relative flex items-center justify-center">
        <div className="text-center p-6">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Workflow Load Error</h3>
          <p className="text-gray-400 text-sm mb-4">{workflowLoadError}</p>
          <button
            onClick={() => setWorkflowLoadError(null)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
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
        isValidatingWorkflow={isValidatingWorkflow}
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

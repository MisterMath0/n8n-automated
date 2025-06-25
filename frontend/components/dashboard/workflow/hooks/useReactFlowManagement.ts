import { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, useReactFlow } from 'reactflow';
import { Workflow } from '@/types/workflow';
import { convertN8NToReactFlow, autoLayoutNodesWithConnections } from '@/lib/utils/workflowConverter';
import { useToast } from '@/components/providers';

export function useReactFlowManagement(workflow: Workflow | null) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowLoadError, setWorkflowLoadError] = useState<string | null>(null);
  
  const { fitView } = useReactFlow();
  const toast = useToast();

  useEffect(() => {
    if (workflow?.workflow) {
      try {
        setWorkflowLoadError(null);
        const { nodes: flowNodes, edges: flowEdges } = convertN8NToReactFlow(workflow.workflow);
        
        const nodesWithLayout = flowNodes.some(node => !node.position.x && !node.position.y) 
          ? autoLayoutNodesWithConnections(flowNodes, flowEdges)
          : flowNodes;
        
        setNodes(nodesWithLayout);
        setEdges(flowEdges);

        setTimeout(() => {
          if (nodesWithLayout.length > 0) {
            fitView({ 
              padding: 0.1, 
              duration: 800,
              minZoom: 0.1,
              maxZoom: 1.5,
            });
          }
        }, 100);
        
      } catch (error) {
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

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    workflowLoadError,
    setWorkflowLoadError,
  };
}

import { useState, useCallback } from 'react';
import { useToast } from '@/components/providers';
import { Workflow } from '@/types/workflow';
import { N8NNode } from '@/types/api';

export function useWorkflowOperations() {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const exportWorkflow = useCallback(async (workflow: Workflow, nodes: any[], edges: any[]) => {
    if (!workflow?.workflow) {
      toast.error('No workflow to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const originalWorkflow = workflow.workflow;
      
      const exportData = {
        ...originalWorkflow,
        nodes: nodes.map(node => {
          const originalNode = originalWorkflow.nodes.find((n: N8NNode) => n.id === node.id);
          return {
            ...originalNode,
            position: [node.position.x, node.position.y] as [number, number],
          };
        }),
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
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  return {
    isExporting,
    exportWorkflow,
  };
}

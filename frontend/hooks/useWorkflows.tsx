"use client";

import { useState, useEffect, useCallback } from "react";
import { workflowStorage, StoredWorkflow } from "@/lib/workflow-storage";
import { N8NWorkflow } from "@/types/api";
import { useToast } from "@/components/providers";

// Convert StoredWorkflow to the interface expected by components
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  lastUpdated: string;
  created: string;
  status: 'active' | 'inactive';
  owner: string;
  nodes?: any[];
  edges?: any[];
  workflow?: N8NWorkflow; // Include the full workflow data
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Convert StoredWorkflow to Workflow interface
  const convertStoredWorkflow = (stored: StoredWorkflow): Workflow => ({
    id: stored.id,
    name: stored.name,
    description: stored.description,
    lastUpdated: stored.lastUpdated,
    created: stored.created,
    status: stored.status,
    owner: stored.owner,
    nodes: stored.workflow.nodes,
    edges: [], // Convert connections to edges if needed
    workflow: stored.workflow
  });

  const fetchWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load workflows from local storage
      const storedWorkflows = workflowStorage.getWorkflows();
      const convertedWorkflows = storedWorkflows.map(convertStoredWorkflow);
      
      setWorkflows(convertedWorkflows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflows';
      setError(errorMessage);
      console.error('Error fetching workflows:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const selectWorkflow = useCallback((workflow: Workflow | null) => {
    setSelectedWorkflow(workflow);
  }, []);

  const saveGeneratedWorkflow = useCallback(async (
    workflow: N8NWorkflow, 
    name?: string, 
    description?: string
  ): Promise<Workflow> => {
    try {
      const stored = workflowStorage.saveWorkflow(workflow, name, description);
      const converted = convertStoredWorkflow(stored);
      
      // Update workflows list
      setWorkflows(prev => [converted, ...prev]);
      
      toast.success(`Workflow "${stored.name}" saved successfully!`);
      return converted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save workflow';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [toast]);

  const updateWorkflow = useCallback(async (
    id: string, 
    updates: Partial<Workflow>
  ): Promise<Workflow> => {
    try {
      const updatedStored = workflowStorage.updateWorkflow(id, {
        name: updates.name,
        description: updates.description,
        status: updates.status
      });
      
      if (!updatedStored) {
        throw new Error('Workflow not found');
      }
      
      const converted = convertStoredWorkflow(updatedStored);
      
      // Update workflows list
      setWorkflows(prev => prev.map(w => w.id === id ? converted : w));
      
      // Update selected workflow if it's the one being updated
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(converted);
      }
      
      toast.success('Workflow updated successfully!');
      return converted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workflow';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [selectedWorkflow, toast]);

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    try {
      const success = workflowStorage.deleteWorkflow(id);
      
      if (!success) {
        throw new Error('Workflow not found');
      }
      
      // Update workflows list
      setWorkflows(prev => prev.filter(w => w.id !== id));
      
      // Clear selection if deleted workflow was selected
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
      
      toast.success('Workflow deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workflow';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [selectedWorkflow, toast]);

  const exportWorkflow = useCallback((id: string) => {
    try {
      workflowStorage.exportWorkflow(id);
      toast.success('Workflow exported successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export workflow';
      toast.error(errorMessage);
    }
  }, [toast]);

  const getWorkflowStats = useCallback(() => {
    return workflowStorage.getStats();
  }, []);

  // Load workflows on mount
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    selectedWorkflow,
    isLoading,
    error,
    selectWorkflow,
    saveGeneratedWorkflow,
    updateWorkflow,
    deleteWorkflow,
    exportWorkflow,
    refetch: fetchWorkflows,
    getWorkflowStats
  };
}

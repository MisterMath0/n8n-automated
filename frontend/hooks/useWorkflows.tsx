"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { workflowStorage, StoredWorkflow } from "@/lib/workflow-storage";
import { N8NWorkflow } from "@/types/api";
import { useToast } from "@/components/providers";
import { useAuth } from "./useAuth";

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
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  // Track if we've already loaded to prevent duplicate fetches
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

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
    if (!user) {
      setWorkflows([]);
      setIsLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    // Prevent duplicate fetches for the same user
    if (hasLoadedRef.current && lastUserIdRef.current === user.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      hasLoadedRef.current = true;
      lastUserIdRef.current = user.id;
      
      // Load workflows from Supabase
      const storedWorkflows = await workflowStorage.getWorkflows(user.id);
      const convertedWorkflows = storedWorkflows.map(convertStoredWorkflow);
      
      setWorkflows(convertedWorkflows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflows';
      setError(errorMessage);
      console.error('Error fetching workflows:', err);
      toast.error(errorMessage);
      hasLoadedRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Only fetch when user changes
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      fetchWorkflows();
    }
  }, [user?.id]); // Only depend on user.id, not the fetchWorkflows function

  const selectWorkflow = useCallback((workflow: Workflow | null) => {
    setSelectedWorkflow(workflow);
  }, []);

  const saveGeneratedWorkflow = useCallback(async (
    workflow: N8NWorkflow, 
    name?: string, 
    description?: string,
    aiModel?: string,
    generationTimeMs?: number,
    tokensUsed?: number
  ): Promise<Workflow> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const stored = await workflowStorage.saveWorkflow(
        workflow, 
        user.id, 
        name, 
        description,
        aiModel,
        generationTimeMs,
        tokensUsed
      );
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
  }, [user, toast]);

  const updateWorkflow = useCallback(async (
    id: string, 
    updates: Partial<Workflow>
  ): Promise<Workflow> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedStored = await workflowStorage.updateWorkflow(id, user.id, {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        workflow: updates.workflow
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
  }, [user, selectedWorkflow, toast]);

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const success = await workflowStorage.deleteWorkflow(id, user.id);
      
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
  }, [user, selectedWorkflow, toast]);

  const exportWorkflow = useCallback(async (id: string) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await workflowStorage.exportWorkflow(id, user.id);
      toast.success('Workflow exported successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export workflow';
      toast.error(errorMessage);
    }
  }, [user, toast]);

  const getWorkflowStats = useCallback(async () => {
    if (!user) return {
      total: 0,
      active: 0,
      inactive: 0,
      totalNodes: 0,
      lastCreated: null
    };

    return await workflowStorage.getStats(user.id);
  }, [user]);

  // Manual refetch that forces a reload
  const refetch = useCallback(() => {
    hasLoadedRef.current = false;
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
    refetch,
    getWorkflowStats
  };
}

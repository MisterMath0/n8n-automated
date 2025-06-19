"use client";

import { useState, useEffect } from "react";

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
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with your API endpoint
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
      console.error('Error fetching workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkflow = (workflow: Workflow | null) => {
    setSelectedWorkflow(workflow);
  };

  const createWorkflow = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) throw new Error('Failed to create workflow');
      
      const newWorkflow = await response.json();
      setWorkflows(prev => [newWorkflow, ...prev]);
      setSelectedWorkflow(newWorkflow);
      
      return newWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      throw err;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update workflow');
      
      const updatedWorkflow = await response.json();
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
      throw err;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete workflow');
      
      setWorkflows(prev => prev.filter(w => w.id !== id));
      
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
      throw err;
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return {
    workflows,
    selectedWorkflow,
    isLoading,
    error,
    selectWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    refetch: fetchWorkflows
  };
}

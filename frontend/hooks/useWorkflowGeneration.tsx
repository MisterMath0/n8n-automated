"use client";

import { useState } from "react";

export interface GeneratedWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  metadata?: {
    generatedAt: string;
    prompt: string;
    version: string;
  };
}

export function useWorkflowGeneration() {
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWorkflow = async (prompt: string) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // TODO: Replace with your AI workflow generation API
      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }
      
      const workflow = await response.json();
      setGeneratedWorkflow(workflow);
      
      return workflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate workflow';
      setError(errorMessage);
      console.error('Workflow generation error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearGenerated = () => {
    setGeneratedWorkflow(null);
    setError(null);
  };

  const saveGeneratedWorkflow = async (name?: string) => {
    if (!generatedWorkflow) return null;
    
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || generatedWorkflow.name,
          description: generatedWorkflow.description,
          nodes: generatedWorkflow.nodes,
          edges: generatedWorkflow.edges,
          metadata: generatedWorkflow.metadata
        })
      });
      
      if (!response.ok) throw new Error('Failed to save workflow');
      
      const savedWorkflow = await response.json();
      setGeneratedWorkflow(null); // Clear after saving
      
      return savedWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
      throw err;
    }
  };

  const exportWorkflow = (workflow: GeneratedWorkflow | null = generatedWorkflow) => {
    if (!workflow) return;
    
    const exportData = {
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
      connections: workflow.edges,
      settings: {},
      staticData: null,
      tags: [],
      triggerCount: 0,
      meta: {
        templateCredsSetupCompleted: true
      },
      ...workflow.metadata
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    generatedWorkflow,
    isGenerating,
    error,
    generateWorkflow,
    clearGenerated,
    saveGeneratedWorkflow,
    exportWorkflow
  };
}

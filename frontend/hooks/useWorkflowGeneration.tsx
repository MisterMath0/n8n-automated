"use client";

// Legacy hook - replaced by useWorkflowGeneration from hooks/api
// This file remains for backward compatibility during migration
// TODO: Remove after all components are updated to use hooks/api

import { useState, useCallback } from "react";
import { useWorkflowGeneration as useWorkflowGenerationAPI } from "@/hooks/api";
import { AIModel, WorkflowGenerationRequest, N8NWorkflow } from "@/types/api";
import { useToast } from "@/components/providers";

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

/**
 * @deprecated Use useWorkflowGeneration from @/hooks/api instead
 * This hook is kept for backward compatibility
 */
export function useWorkflowGeneration() {
  const apiHook = useWorkflowGenerationAPI();
  const toast = useToast();
  const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.CLAUDE_4_SONNET);

  const generateWorkflow = useCallback(async (prompt: string) => {
    try {
      const request: WorkflowGenerationRequest = {
        description: prompt,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      const response = await apiHook.generateWorkflow(request);
      
      if (response.success && response.workflow) {
        toast.success(`Workflow generated successfully! (${response.generation_time.toFixed(2)}s)`);
        
        // Transform to legacy format
        const legacyWorkflow: GeneratedWorkflow = {
          id: response.workflow.id,
          name: response.workflow.name,
          description: prompt,
          nodes: response.workflow.nodes,
          edges: [], // Convert connections to edges if needed
          metadata: {
            generatedAt: new Date().toISOString(),
            prompt,
            version: '1.0',
          },
        };
        
        return legacyWorkflow;
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      toast.handleApiError(error, 'Failed to generate workflow');
      throw error;
    }
  }, [apiHook, selectedModel, toast]);

  const exportWorkflow = useCallback((workflow: N8NWorkflow | null) => {
    if (!workflow) return;
    
    const exportData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      pinData: workflow.pinData || {},
      tags: workflow.tags || [],
      active: workflow.active,
      versionId: workflow.versionId,
      meta: workflow.meta || {},
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
  }, []);

  return {
    generatedWorkflow: apiHook.workflow,
    isGenerating: apiHook.isGenerating,
    error: apiHook.error,
    generateWorkflow,
    clearGenerated: apiHook.clearGenerated,
    exportWorkflow,
    // New properties from API
    selectedModel,
    setSelectedModel,
    generationTime: apiHook.generationTime,
    tokensUsed: apiHook.tokensUsed,
    modelUsed: apiHook.modelUsed,
    warnings: apiHook.warnings,
  };
}

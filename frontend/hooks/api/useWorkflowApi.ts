"use client";

import { useState, useCallback } from 'react';
import { 
  workflowService,
  WorkflowGenerationRequest,
  WorkflowGenerationResponse,
  WorkflowEditRequest,
  WorkflowEditResponse,
  APIClientError,
  NetworkError,
  TimeoutError,
} from '@/lib/api';

// Generic API hook state
interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Error handler utility
const getErrorMessage = (error: unknown): string => {
  if (error instanceof APIClientError) {
    return error.message;
  }
  if (error instanceof NetworkError) {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Hook for workflow generation operations
 * Handles only React state management - API calls are delegated to services
 */
export function useWorkflowGeneration() {
  const [state, setState] = useState<APIState<WorkflowGenerationResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const generateWorkflow = useCallback(async (request: WorkflowGenerationRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await workflowService.generateWorkflow(request);
      setState({
        data: response,
        loading: false,
        error: null,
      });
      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error; // Re-throw for component error handling
    }
  }, []);

  const clearGenerated = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    generateWorkflow,
    clearGenerated,
    // Computed properties
    workflow: state.data?.workflow || null,
    isGenerating: state.loading,
    generationTime: state.data?.generation_time,
    tokensUsed: state.data?.tokens_used,
    modelUsed: state.data?.model_used,
    warnings: state.data?.warnings || [],
  };
}

/**
 * Hook for workflow editing operations
 */
export function useWorkflowEdit() {
  const [state, setState] = useState<APIState<WorkflowEditResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const editWorkflow = useCallback(async (request: WorkflowEditRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await workflowService.editWorkflow(request);
      setState({
        data: response,
        loading: false,
        error: null,
      });
      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  const clearEdit = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    editWorkflow,
    clearEdit,
    // Computed properties
    workflow: state.data?.workflow || null,
    isEditing: state.loading,
    changesMade: state.data?.changes_made || [],
    editTime: state.data?.generation_time,
    tokensUsed: state.data?.tokens_used,
    modelUsed: state.data?.model_used,
  };
}

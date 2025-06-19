// Export all API hooks from a single entry point
// This provides a clean interface for components

export { useWorkflowGeneration, useWorkflowEdit, useChatWithAI } from './useWorkflowApi';
export { useModels, useServiceHealth } from './useModelApi';

// Re-export types for convenience
export type {
  WorkflowGenerationRequest,
  WorkflowEditRequest,
  AIModel,
  AIProvider,
  N8NWorkflow,
  AIModelInfo,
} from '@/lib/api';

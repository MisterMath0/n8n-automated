import { apiClient } from '../client';
import { API_ROUTES, ENDPOINT_TIMEOUTS } from '../config';
import {
  WorkflowGenerationRequest,
  WorkflowGenerationResponse,
  WorkflowEditRequest,
  WorkflowEditResponse,
  AvailableModelsResponse,
  HealthResponse,
} from '@/types/api';

/**
 * Workflow API Service
 * Handles all workflow-related API operations
 * Follows single responsibility principle - only workflow operations
 */
export class WorkflowService {
  /**
   * Generate a new workflow from description
   */
  async generateWorkflow(
    request: WorkflowGenerationRequest
  ): Promise<WorkflowGenerationResponse> {
    return apiClient.post<WorkflowGenerationResponse>(
      API_ROUTES.WORKFLOWS.GENERATE,
      request,
      {
        timeout: ENDPOINT_TIMEOUTS.GENERATE,
      }
    );
  }

  /**
   * Edit an existing workflow
   */
  async editWorkflow(
    request: WorkflowEditRequest
  ): Promise<WorkflowEditResponse> {
    return apiClient.post<WorkflowEditResponse>(
      API_ROUTES.WORKFLOWS.EDIT,
      request,
      {
        timeout: ENDPOINT_TIMEOUTS.EDIT,
      }
    );
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<AvailableModelsResponse> {
    return apiClient.get<AvailableModelsResponse>(
      API_ROUTES.WORKFLOWS.MODELS,
      {
        timeout: ENDPOINT_TIMEOUTS.MODELS,
      }
    );
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<HealthResponse> {
    return apiClient.get<HealthResponse>(
      API_ROUTES.WORKFLOWS.HEALTH,
      {
        timeout: ENDPOINT_TIMEOUTS.HEALTH,
      }
    );
  }

  /**
   * Chat with AI using tool-based system
   */
  async chatWithAI(request: import('@/types/api').ChatRequest): Promise<import('@/types/api').ChatResponse> {
    return apiClient.post<import('@/types/api').ChatResponse>(
      API_ROUTES.WORKFLOWS.CHAT,
      request,
      {
        timeout: ENDPOINT_TIMEOUTS.GENERATE, // Use GENERATE timeout for chat
      }
    );
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();

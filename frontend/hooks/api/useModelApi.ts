"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  workflowService,
  AvailableModelsResponse,
  HealthResponse,
  AIModelInfo,
  APIClientError,
  NetworkError,
  TimeoutError,
} from '@/lib/api';

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
 * Hook for managing available AI models
 * Fetches and caches model information
 */
export function useModels() {
  const [models, setModels] = useState<AIModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchModels = useCallback(async (force = false) => {
    // Don't refetch if we have recent data (unless forced)
    if (!force && lastFetch && Date.now() - lastFetch.getTime() < 5 * 60 * 1000) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await workflowService.getAvailableModels();
      console.log('🔍 [DEBUG] Available models from API:', response.models);
      setModels(response.models);
      setLastFetch(new Date());
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Helper methods
  const getModelByProvider = useCallback((provider: string) => {
    return models.filter(model => model.provider === provider);
  }, [models]);

  const getModelInfo = useCallback((modelName: string) => {
    return models.find(model => model.name === modelName);
  }, [models]);

  const getCheapestModel = useCallback(() => {
    if (models.length === 0) return null;
    return models.reduce((cheapest, current) => 
      current.cost_per_1k_input_tokens < cheapest.cost_per_1k_input_tokens 
        ? current 
        : cheapest
    );
  }, [models]);

  const getFastestModel = useCallback(() => {
    // In a real app, you'd have performance metrics
    // For now, return the first model that supports streaming
    return models.find(model => model.supports_streaming) || models[0] || null;
  }, [models]);

  return {
    models,
    loading,
    error,
    lastFetch,
    // Methods
    refetch: () => fetchModels(true),
    getModelByProvider,
    getModelInfo,
    getCheapestModel,
    getFastestModel,
    // Computed properties
    hasModels: models.length > 0,
    availableProviders: [...new Set(models.map(m => m.provider))],
  };
}

/**
 * Hook for service health monitoring
 */
export function useServiceHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await workflowService.checkHealth();
      setHealth(response);
      setLastCheck(new Date());
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    loading,
    error,
    lastCheck,
    checkHealth,
    // Computed properties
    isHealthy: health?.status === 'healthy',
    availableProviders: health?.providers ? Object.keys(health.providers) : [],
    activeProviders: health?.providers 
      ? Object.entries(health.providers).filter(([_, active]) => active).map(([provider]) => provider)
      : [],
  };
}

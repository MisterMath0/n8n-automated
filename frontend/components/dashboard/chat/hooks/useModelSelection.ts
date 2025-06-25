import { useState, useCallback, useEffect, useRef } from 'react';
import { AIModel } from '@/types/api';
import { DEFAULT_MODEL, SELECTED_MODEL_KEY } from '@/types/constants';

export function useModelSelection(availableModels: any[]) {
  const [selectedModel, setSelectedModelState] = useState<AIModel>(DEFAULT_MODEL);
  const isInitialized = useRef(false);

  // Initialize from localStorage only once
  useEffect(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      const stored = localStorage.getItem(SELECTED_MODEL_KEY);
      if (stored && Object.values(AIModel).includes(stored as AIModel)) {
        setSelectedModelState(stored as AIModel);
      }
      isInitialized.current = true;
    }
  }, []);

  // Auto-select valid model when available models change
  useEffect(() => {
    if (availableModels.length > 0 && isInitialized.current) {
      const currentModelAvailable = availableModels.some(m => m.model_id === selectedModel);
      if (!currentModelAvailable) {
        const defaultModel = availableModels.find(m => m.model_id === AIModel.GEMINI_2_5_FLASH) || availableModels[0];
        setSelectedModel(defaultModel.model_id);
      }
    }
  }, [availableModels.length, selectedModel]); // Only depend on length, not the full array

  const setSelectedModel = useCallback((model: AIModel) => {
    setSelectedModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, model);
    }
  }, []);

  return {
    selectedModel,
    setSelectedModel,
  };
}

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Save, RotateCcw } from 'lucide-react';
import { ModelSelectionGrid } from './ModelSelectionGrid';
import { useModels } from '@/hooks/api';
import { AIModel } from '@/types/api';

interface ModelSelectorProps {
  selectedModel: AIModel | null;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  disabled = false,
  compact = false 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { models, loading, error, refetch, getModelInfo } = useModels();

  const selectedModelInfo = selectedModel ? getModelInfo(selectedModel) : null;

  const handleModelSelect = (modelName: string) => {
    // Convert model name back to AIModel enum
    const modelEnum = Object.values(AIModel).find(
      model => getModelInfo(model)?.name === modelName
    );
    
    if (modelEnum) {
      onModelChange(modelEnum);
      setIsOpen(false);
    }
  };

  const getCurrentModelName = () => {
    if (!selectedModel) return 'Select Model';
    return selectedModelInfo?.name || selectedModel;
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">{getCurrentModelName()}</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 w-96 max-h-96 overflow-y-auto bg-black/90 border border-white/20 rounded-lg p-4 z-50"
            >
              <ModelSelectionGrid
                models={models}
                selectedModel={selectedModelInfo?.name || null}
                onModelSelect={handleModelSelect}
                loading={loading}
                error={error}
                onRetry={refetch}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Settings className="w-4 h-4" />
        <span>{getCurrentModelName()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-white/20 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Select AI Model
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Choose the AI model for workflow generation
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <ModelSelectionGrid
                  models={models}
                  selectedModel={selectedModelInfo?.name || null}
                  onModelSelect={handleModelSelect}
                  loading={loading}
                  error={error}
                  onRetry={refetch}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={refetch}
                    className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm">Refresh</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={!selectedModel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Selection</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

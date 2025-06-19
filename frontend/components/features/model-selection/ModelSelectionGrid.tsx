"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Clock, DollarSign, Brain, Loader2 } from 'lucide-react';
import { AIModelInfo, AIModel, AIProvider } from '@/types/api';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: AIModelInfo;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function ModelCard({ model, isSelected, onSelect, disabled = false }: ModelCardProps) {
  const providerColors = {
    [AIProvider.ANTHROPIC]: 'from-orange-500 to-red-600',
    [AIProvider.OPENAI]: 'from-green-500 to-emerald-600',
    [AIProvider.GROQ]: 'from-purple-500 to-pink-600',
  };

  const providerIcons = {
    [AIProvider.ANTHROPIC]: '🤖',
    [AIProvider.OPENAI]: '🧠',
    [AIProvider.GROQ]: '⚡',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        "relative p-4 rounded-lg border cursor-pointer transition-all duration-200",
        isSelected 
          ? "border-green-500 bg-green-500/10" 
          : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Provider badge */}
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3",
        "bg-gradient-to-r text-white",
        providerColors[model.provider]
      )}>
        <span>{providerIcons[model.provider]}</span>
        <span className="capitalize">{model.provider}</span>
      </div>

      {/* Model name */}
      <h3 className="text-white font-semibold text-lg mb-2">
        {model.name}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {model.description}
      </p>

      {/* Features */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">
            {model.context_window.toLocaleString()} context
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">
            Max {model.max_tokens.toLocaleString()} tokens
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">
            ${model.cost_per_1k_input_tokens.toFixed(4)} / ${model.cost_per_1k_output_tokens.toFixed(4)} per 1k
          </span>
        </div>

        {model.supports_streaming && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300">Streaming support</span>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-2">
        {model.supports_json_mode && (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
            JSON Mode
          </span>
        )}
        {model.supports_streaming && (
          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            Streaming
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface ModelSelectionGridProps {
  models: AIModelInfo[];
  selectedModel: string | null;
  onModelSelect: (modelName: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ModelSelectionGrid({ 
  models, 
  selectedModel, 
  onModelSelect, 
  loading = false,
  error = null,
  onRetry
}: ModelSelectionGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading available models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">Failed to load models</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-400">No models available</p>
          <p className="text-gray-500 text-sm mt-2">
            Check your API configuration and try again
          </p>
        </div>
      </div>
    );
  }

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<AIProvider, AIModelInfo[]>);

  return (
    <div className="space-y-8">
      {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
        <div key={provider}>
          <h3 className="text-white font-semibold text-lg mb-4 capitalize">
            {provider} Models
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providerModels.map((model) => (
              <ModelCard
                key={model.name}
                model={model}
                isSelected={selectedModel === model.name}
                onSelect={() => onModelSelect(model.name)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

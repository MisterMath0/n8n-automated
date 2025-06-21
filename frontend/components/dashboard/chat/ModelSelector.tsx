"use client";

import { Settings, Zap, Sparkles } from "lucide-react";
import { AIModel, AIModelInfo } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MODEL_ENUM_TO_NAME } from "../../../types/constants";

interface ModelSelectorProps {
  selectedModel: AIModel;
  availableModels: AIModelInfo[];
  modelsLoading: boolean;
  isGenerating: boolean;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, availableModels, modelsLoading, isGenerating, onModelChange }: ModelSelectorProps) {
  // Group models by provider
  const groupedModels = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModelInfo[]>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={modelsLoading || isGenerating || availableModels.length === 0}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
        {Object.entries(groupedModels).map(([provider, models]) => (
          <div key={provider}>
            <DropdownMenuLabel className="text-xs font-bold uppercase text-muted-foreground">
              {provider}
            </DropdownMenuLabel>
            {models.map((model) => {
              const modelEnum = model.model_id;
              const displayName = MODEL_ENUM_TO_NAME[modelEnum] || model.name;
              
              return (
                <DropdownMenuItem
                  key={model.model_id}
                  onClick={() => {

                    onModelChange(modelEnum);
                  }}
                  className={cn(
                    "flex flex-col items-start py-1 gap-1",
                    selectedModel === modelEnum && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-1 w-full">
                    <div className="font-medium flex-1">{displayName}</div>

                  </div>

                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
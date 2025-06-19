"use client";

import { Settings } from "lucide-react";
import { AIModel } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MODEL_NAME_TO_ENUM } from "./constants";

interface ModelSelectorProps {
  selectedModel: AIModel;
  availableModels: any[];
  modelsLoading: boolean;
  isGenerating: boolean;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, availableModels, modelsLoading, isGenerating, onModelChange }: ModelSelectorProps) {
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
      <DropdownMenuContent align="end" className="w-72">
        {availableModels.map((model) => {
          const modelEnum = MODEL_NAME_TO_ENUM[model.name];
          if (!modelEnum) return null;
          
          return (
            <DropdownMenuItem
              key={model.name}
              onClick={() => {
                console.log('🔍 [DEBUG] Model changed to:', model.name);
                onModelChange(modelEnum);
              }}
              className={cn(
                "flex flex-col items-start py-3",
                selectedModel === modelEnum && "bg-accent"
              )}
            >
              <div className="font-medium">{model.name}</div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
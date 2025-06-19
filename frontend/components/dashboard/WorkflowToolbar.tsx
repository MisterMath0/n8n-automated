"use client";

import { Share, MoreHorizontal } from "lucide-react";
import { Workflow, GeneratedWorkflow } from "@/hooks/useWorkflows";

interface WorkflowToolbarProps {
  workflow: Workflow | GeneratedWorkflow;
}

export function WorkflowToolbar({ workflow }: WorkflowToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 z-30">
      {/* Workflow Info */}
      <div className="flex items-center gap-4">
        <h3 className="text-white font-medium">
          {workflow.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">+ Add tag</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {workflow.status || 'draft'}
            </span>
            <div className={`w-2 h-2 rounded-full ${
              workflow.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border border-white/20 rounded-lg">
          <button className="px-3 py-1 text-white bg-white/10 text-sm rounded-l-lg border-r border-white/20">
            Editor
          </button>
          <button className="px-3 py-1 text-gray-400 text-sm hover:text-white transition-colors">
            Executions
          </button>
        </div>
        
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Share className="w-4 h-4" />
        </button>
        
        <span className="text-xs text-gray-400">Saved</span>
        
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

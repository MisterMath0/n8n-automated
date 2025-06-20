"use client";

import { Share } from "lucide-react";
import { Workflow } from "@/hooks/useWorkflows";
import { useToast } from '@/components/providers';
import { useState } from "react";

interface WorkflowToolbarProps {
  workflow: Workflow;
}

export function WorkflowToolbar({ workflow }: WorkflowToolbarProps) {
  const [isSharing, setIsSharing] = useState(false);
  const toast = useToast();

  const handleShare = async () => {
    if (!workflow?.workflow) {
      toast.error('No workflow to share');
      return;
    }

    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `N8N Workflow: ${workflow.name}`,
          text: `Check out this N8N workflow: ${workflow.name}`,
          url: window.location.href
        });
      } else {
        // Fallback to copy URL
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Share failed');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 z-30">
      {/* Workflow Info */}
      <div className="flex items-center gap-4">
        <h3 className="text-white font-medium">
          {workflow.name}
        </h3>
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border border-white/20 rounded-lg">
          <button className="px-3 py-1 text-white bg-white/10 text-sm rounded-lg">
            Editor
          </button>
        </div>
        
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <Share className="w-4 h-4" />
        </button>
        
        <span className="text-xs text-green-400">Auto-saved</span>
      </div>
    </div>
  );
}

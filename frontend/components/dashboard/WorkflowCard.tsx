"use client";

import { motion } from "framer-motion";
import { Clock, User, MoreHorizontal } from "lucide-react";
import { Workflow } from "@/hooks/useWorkflows";

interface WorkflowCardProps {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: () => void;
}

export function WorkflowCard({ workflow, isSelected, onSelect }: WorkflowCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
      onClick={onSelect}
      className={`p-4 cursor-pointer border-b border-white/5 transition-all group ${
        isSelected ? 'bg-white/5 border-l-2 border-l-green-400' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-medium text-sm leading-tight pr-2 group-hover:text-green-400 transition-colors">
          {workflow.name}
        </h3>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {workflow.description && (
        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
          {workflow.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(workflow.lastUpdated)}</span>
          </div>
          <span>Created {formatDate(workflow.created)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">{workflow.owner}</span>
          <div className={`w-2 h-2 rounded-full ${
            workflow.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
          }`} />
        </div>
      </div>
    </motion.div>
  );
}

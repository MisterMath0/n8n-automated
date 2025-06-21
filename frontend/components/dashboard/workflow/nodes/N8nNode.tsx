"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { getNodeIcon, getNodeColor, isTriggerNode } from "@/lib/utils/node-styling";

export type N8nNodeData = {
  label: string;
  nodeType: string;
  subtitle?: string;
  parameters?: Record<string, any>;
};

export function N8nNode({ data, selected, dragging }: NodeProps<N8nNodeData>) {
  const Icon = getNodeIcon(data.nodeType);
  const colorClass = getNodeColor(data.nodeType);
  const isTriggering = isTriggerNode(data.nodeType);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        duration: 0.4, 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      {/* Left Handle (Input) - Hidden for trigger nodes */}
      {!isTriggering && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white/90 !border-2 !border-white shadow-lg !-left-2 transition-all duration-200 hover:!bg-white hover:scale-110"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      )}

      {/* Glowing Background Effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} rounded-xl blur-sm opacity-50 group-hover:opacity-80 transition-all duration-300 ${
          selected ? 'opacity-90 scale-105' : ''
        } ${
          dragging ? 'opacity-100 scale-110' : ''
        }`}
      />

      {/* Main Node Container - Fixed width for consistent layout */}
      <div
        className={`relative backdrop-blur-sm bg-black/90 border-2 ${
          colorClass.split(' ')[2] || 'border-white/30'
        } rounded-xl shadow-2xl w-48 transition-all duration-300 ${
          selected ? 'border-opacity-80 shadow-lg' : 'border-opacity-40'
        } ${
          dragging ? 'shadow-2xl border-opacity-100' : ''
        }`}
      >
        {/* Trigger Badge */}
        {isTriggering && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="bg-violet-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg border border-violet-400">
              START
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Icon with pulse effect for triggers */}
            <div className={`flex-shrink-0 ${isTriggering ? 'animate-pulse' : ''}`}>
              <Icon className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            
            {/* Node Name */}
            <div className="flex-1 min-w-10">
              <h3 className="text-white font-semibold text-xs leading-tight truncate">
                {data.label}
              </h3>
            </div>
          </div>
        </div>

        {/* Subtitle Section */}
        {data.subtitle && (
          <div className="px-4 py-2">
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
              {data.subtitle}
            </p>
          </div>
        )}

        {/* Parameters Preview (if available) */}
        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="px-4 py-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-60"></div>
              <span className="text-gray-400 text-xs">
                {Object.keys(data.parameters).length} parameter{Object.keys(data.parameters).length !== 1 ? 's' : ''} configured
              </span>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-3 right-3">
          <div className={`w-2 h-2 rounded-full ${
            selected ? 'bg-white' : 'bg-white/50'
          } transition-all duration-200`}></div>
        </div>
      </div>

      {/* Right Handle (Output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-white/90 !border-2 !border-white shadow-lg !-right-2 transition-all duration-200 hover:!bg-white hover:scale-110"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Hover Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/20">
        {data.nodeType}
      </div>
    </motion.div>
  );
}

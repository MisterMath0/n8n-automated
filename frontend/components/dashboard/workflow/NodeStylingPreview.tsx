"use client";

import { useState } from 'react';
import { getNodeIcon, getNodeColor, getNodeCategory, isTriggerNode } from '@/lib/utils/node-styling';
import { testNodeStyling } from '@/lib/utils/node-styling-test';

export function NodeStylingPreview() {
  const [selectedNodeType, setSelectedNodeType] = useState('n8n-nodes-base.webhook');
  
  // Sample N8N node types for testing
  const sampleNodeTypes = [
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.manualTrigger',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.function',
    'n8n-nodes-base.gmail',
    'n8n-nodes-base.slack',
    'n8n-nodes-base.postgres',
    'n8n-nodes-base.googleSheets',
    'n8n-nodes-base.if',
    'n8n-nodes-base.set',
    'n8n-nodes-base.twitter',
    'n8n-nodes-base.stripe',
  ];

  const Icon = getNodeIcon(selectedNodeType);
  const colorClass = getNodeColor(selectedNodeType);
  const category = getNodeCategory(selectedNodeType);
  const isTriggering = isTriggerNode(selectedNodeType);

  const handleRunTest = () => {
    testNodeStyling();
  };

  return (
    <div className="p-6 space-y-6 bg-black/60 rounded-xl border border-white/20">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">N8N Node Styling Preview</h2>
        <p className="text-gray-400">Test the enhanced icon and styling system</p>
      </div>

      {/* Node Type Selector */}
      <div className="space-y-2">
        <label className="text-white text-sm font-medium">Select Node Type:</label>
        <select
          value={selectedNodeType}
          onChange={(e) => setSelectedNodeType(e.target.value)}
          className="w-full p-2 bg-black/80 border border-white/30 rounded text-white text-sm"
        >
          {sampleNodeTypes.map(nodeType => (
            <option key={nodeType} value={nodeType}>
              {nodeType}
            </option>
          ))}
        </select>
      </div>

      {/* Preview Node */}
      <div className="flex justify-center">
        <div className="relative group">
          {/* Trigger Badge */}
          {isTriggering && (
            <div className="absolute -top-2 -right-2 z-10">
              <div className="bg-violet-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg border border-violet-400">
                START
              </div>
            </div>
          )}

          {/* Glowing Background Effect */}
          <div
            className={`absolute -inset-1 bg-gradient-to-br ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} rounded-xl blur-sm opacity-50 group-hover:opacity-80 transition-all duration-300`}
          />

          {/* Main Node Container */}
          <div
            className={`relative backdrop-blur-sm bg-black/90 border-2 ${
              colorClass.split(' ')[2] || 'border-white/30'
            } rounded-xl shadow-2xl min-w-[200px] transition-all duration-300`}
          >
            {/* Header Section */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 ${isTriggering ? 'animate-pulse' : ''}`}>
                  <Icon className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm leading-tight truncate">
                    Sample Node
                  </h3>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="px-4 py-2 space-y-2">
              <div className="text-gray-300 text-xs">
                <strong>Type:</strong> {selectedNodeType}
              </div>
              <div className="text-gray-300 text-xs">
                <strong>Category:</strong> {category}
              </div>
              <div className="text-gray-300 text-xs">
                <strong>Is Trigger:</strong> {isTriggering ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test All Button */}
      <div className="text-center">
        <button
          onClick={handleRunTest}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          Run Complete Test (Check Console)
        </button>
        <p className="text-gray-400 text-xs mt-2">
          This will test all node types and log results to the browser console
        </p>
      </div>

      {/* Color Guide */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold">Color Categories:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'Triggers', class: 'from-violet-500/30 to-purple-600/20' },
            { name: 'Logic', class: 'from-cyan-400/30 to-blue-500/20' },
            { name: 'Communication', class: 'from-blue-400/30 to-indigo-500/20' },
            { name: 'Data', class: 'from-emerald-400/30 to-green-500/20' },
            { name: 'Web/API', class: 'from-orange-400/30 to-amber-500/20' },
            { name: 'Social', class: 'from-pink-400/30 to-rose-500/20' },
          ].map(cat => (
            <div key={cat.name} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded bg-gradient-to-br ${cat.class}`} />
              <span className="text-gray-300">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

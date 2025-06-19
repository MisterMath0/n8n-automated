"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Plus, MoreHorizontal, Clock, User, Filter, Loader2 } from "lucide-react";
import { Workflow } from "@/hooks/useWorkflows";
import { WorkflowCard } from "./WorkflowCard";
import { EmptyWorkflows } from "./EmptyWorkflows";

interface WorkflowSidebarProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow | null) => void;
  isLoading: boolean;
}

export function WorkflowSidebar({ 
  workflows, 
  selectedWorkflow, 
  onSelectWorkflow, 
  isLoading 
}: WorkflowSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Filter and sort workflows
  const filteredWorkflows = workflows
    .filter(workflow =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        case 'lastUpdated':
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateWorkflow = () => {
    // TODO: Implement create workflow modal/flow
    console.log('Create new workflow');
  };

  return (
    <div className="w-80 h-full bg-black/80 border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Overview</h2>
          <motion.button
            onClick={handleCreateWorkflow}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium flex items-center gap-2 hover:shadow-green-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </motion.button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          All your AI-generated workflows and automations
        </p>

        {/* Tabs */}
        <div className="flex gap-1">
          <button className="px-4 py-2 text-green-400 border-b-2 border-green-400 text-sm font-medium">
            Workflows
          </button>
          <button className="px-4 py-2 text-gray-400 text-sm hover:text-gray-300 transition-colors">
            Templates
          </button>
          <button className="px-4 py-2 text-gray-400 text-sm hover:text-gray-300 transition-colors">
            History
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-green-400/50 focus:outline-none focus:ring-1 focus:ring-green-400/20 transition-all text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Sort by</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white border-none outline-none cursor-pointer"
            >
              <option value="lastUpdated" className="bg-gray-800">last updated</option>
              <option value="name" className="bg-gray-800">name</option>
              <option value="created" className="bg-gray-800">created</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-300 transition-colors" />
            <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-300 transition-colors" />
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          searchQuery ? (
            <div className="p-4 text-center text-gray-400">
              <p>No workflows found for "{searchQuery}"</p>
            </div>
          ) : (
            <EmptyWorkflows onCreateWorkflow={handleCreateWorkflow} />
          )
        ) : (
          <div className="space-y-1">
            {paginatedWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isSelected={selectedWorkflow?.id === workflow.id}
                onSelect={() => onSelectWorkflow(workflow)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredWorkflows.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Total {filteredWorkflows.length}</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                {currentPage}
              </span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-gray-400 border-none outline-none text-xs"
              >
                <option value="25">25/page</option>
                <option value="50">50/page</option>
                <option value="100">100/page</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

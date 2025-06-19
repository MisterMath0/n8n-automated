"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WorkflowCanvas } from "@/components/dashboard/WorkflowCanvas";
import { AIChat } from "@/components/dashboard/AIChat";
import { WorkflowSidebar } from "@/components/dashboard/WorkflowSidebar";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowGeneration } from "@/hooks/useWorkflowGeneration";

export default function DashboardPage() {
  const { workflows, selectedWorkflow, selectWorkflow, isLoading } = useWorkflows();
  const { generateWorkflow, generatedWorkflow, isGenerating } = useWorkflowGeneration();
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <DashboardLayout>
      <div className="flex h-screen bg-black">
        <WorkflowSidebar 
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          onSelectWorkflow={selectWorkflow}
          isLoading={isLoading}
        />
        
        <div className="flex-1 flex">
          <WorkflowCanvas 
            workflow={generatedWorkflow || selectedWorkflow}
          />
          
          {isChatOpen && (
            <AIChat 
              onClose={() => setIsChatOpen(false)}
              onGenerateWorkflow={generateWorkflow}
              isGenerating={isGenerating}
            />
          )}
        </div>
        
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed right-4 bottom-4 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-green-500/25 transition-all z-50"
          >
            <span className="text-white font-bold">AI</span>
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}

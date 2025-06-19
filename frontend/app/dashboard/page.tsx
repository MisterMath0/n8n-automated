"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WorkflowCanvas } from "@/components/dashboard/workflow/WorkflowCanvas";
import { SimpleChat } from "@/components/dashboard/chat/SimpleChat";
import { WorkflowSidebar } from "@/components/dashboard/workflow/WorkflowSidebar";
import { useWorkflows } from "@/hooks/useWorkflows";
import { N8NWorkflow } from "@/types/api";
import { useToast } from "@/components/providers";


export default function DashboardPage() {
  const { workflows, selectedWorkflow, selectWorkflow, isLoading, saveGeneratedWorkflow, exportWorkflow, deleteWorkflow } = useWorkflows();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [currentWorkflow, setCurrentWorkflow] = useState<N8NWorkflow | null>(null);
  const toast = useToast();

  const handleWorkflowGenerated = async (workflow: N8NWorkflow) => {
    setCurrentWorkflow(workflow);
    
    // Automatically save generated workflows
    try {
      await saveGeneratedWorkflow(workflow);
      toast.success(`Workflow "${workflow.name}" generated and saved!`);
    } catch (error) {
      console.error('Failed to save generated workflow:', error);
      toast.warning('Workflow generated but failed to save locally');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-screen bg-black">
        <WorkflowSidebar 
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          onSelectWorkflow={selectWorkflow}
          onExportWorkflow={exportWorkflow}
          onDeleteWorkflow={deleteWorkflow}
          isLoading={isLoading}
        />
        
        <div className="flex-1 flex">
          <WorkflowCanvas 
            workflow={currentWorkflow || selectedWorkflow}
          />
          
          {isChatOpen && (
            <SimpleChat 
              onClose={() => setIsChatOpen(false)}
              onWorkflowGenerated={handleWorkflowGenerated}
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

"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
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
    
    // The workflow is now automatically saved by the backend
    // We just need to update the local state and show success
    try {
      await saveGeneratedWorkflow(
        workflow, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined
      );
      toast.success(`Workflow "${workflow.name}" generated and saved!`);
    } catch (error) {
      console.error('Failed to sync generated workflow:', error);
      toast.warning('Workflow generated but failed to sync');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-black overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <WorkflowSidebar 
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            onSelectWorkflow={selectWorkflow}
            onExportWorkflow={exportWorkflow}
            onDeleteWorkflow={deleteWorkflow}
            isLoading={isLoading}
          />
          
          <div className="flex-1 flex overflow-hidden">
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
      </div>
    </DashboardLayout>
  );
}

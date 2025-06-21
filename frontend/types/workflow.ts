import { Database } from '@/types/supabase';
import { N8NWorkflow } from '@/types/api';

// Base workflow type from database
export type WorkflowRow = Database['public']['Tables']['workflows']['Row'];

// Extended workflow type for UI components  
export interface Workflow extends WorkflowRow {
  // Computed properties for backward compatibility
  workflow: N8NWorkflow;           // Maps to workflow_data
  nodes: any[];                    // Maps to workflow_data.nodes
  lastUpdated: string;             // Maps to updated_at
}

// Helper function to transform database row to UI workflow
export function transformWorkflowForUI(dbWorkflow: WorkflowRow): Workflow {
  const workflow_data = dbWorkflow.workflow_data as N8NWorkflow;
  
  return {
    ...dbWorkflow,
    workflow: workflow_data,
    nodes: workflow_data?.nodes || [],
    lastUpdated: dbWorkflow.updated_at,
  };
}

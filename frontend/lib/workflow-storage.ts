import { N8NWorkflow } from '@/types/api';

// Local storage key for workflows
const WORKFLOWS_STORAGE_KEY = 'n8n_ai_workflows';

export interface StoredWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow: N8NWorkflow;
  created: string;
  lastUpdated: string;
  status: 'active' | 'inactive';
  owner: string;
}

/**
 * Local workflow storage service
 * Since the backend doesn't have workflow persistence yet,
 * we'll store workflows locally until backend storage is implemented
 */
export class WorkflowStorageService {
  /**
   * Get all stored workflows
   */
  getWorkflows(): StoredWorkflow[] {
    try {
      const stored = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load workflows from storage:', error);
      return [];
    }
  }

  /**
   * Save a new workflow
   */
  saveWorkflow(workflow: N8NWorkflow, name?: string, description?: string): StoredWorkflow {
    const workflows = this.getWorkflows();
    
    const storedWorkflow: StoredWorkflow = {
      id: workflow.id,
      name: name || workflow.name,
      description: description || `Generated workflow with ${workflow.nodes.length} nodes`,
      workflow,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
      owner: 'current_user' // TODO: Replace with real user when auth is implemented
    };

    workflows.unshift(storedWorkflow); // Add to beginning
    this.saveWorkflows(workflows);
    
    return storedWorkflow;
  }

  /**
   * Update an existing workflow
   */
  updateWorkflow(id: string, updates: Partial<StoredWorkflow>): StoredWorkflow | null {
    const workflows = this.getWorkflows();
    const index = workflows.findIndex(w => w.id === id);
    
    if (index === -1) {
      throw new Error(`Workflow with id ${id} not found`);
    }

    const updatedWorkflow = {
      ...workflows[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    workflows[index] = updatedWorkflow;
    this.saveWorkflows(workflows);
    
    return updatedWorkflow;
  }

  /**
   * Delete a workflow
   */
  deleteWorkflow(id: string): boolean {
    const workflows = this.getWorkflows();
    const filteredWorkflows = workflows.filter(w => w.id !== id);
    
    if (filteredWorkflows.length === workflows.length) {
      return false; // Workflow not found
    }

    this.saveWorkflows(filteredWorkflows);
    return true;
  }

  /**
   * Get a specific workflow by ID
   */
  getWorkflow(id: string): StoredWorkflow | null {
    const workflows = this.getWorkflows();
    return workflows.find(w => w.id === id) || null;
  }

  /**
   * Export workflow to N8N JSON format
   */
  exportWorkflow(id: string): void {
    const storedWorkflow = this.getWorkflow(id);
    if (!storedWorkflow) {
      throw new Error(`Workflow with id ${id} not found`);
    }

    const { workflow } = storedWorkflow;
    const exportData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || { executionOrder: "v1" },
      pinData: workflow.pinData || {},
      tags: workflow.tags || [],
      active: workflow.active,
      versionId: workflow.versionId,
      meta: {
        ...workflow.meta,
        exportedAt: new Date().toISOString(),
        exportedBy: 'N8N AI Generator'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all workflows (for testing/reset)
   */
  clearAll(): void {
    localStorage.removeItem(WORKFLOWS_STORAGE_KEY);
  }

  /**
   * Get workflow statistics
   */
  getStats() {
    const workflows = this.getWorkflows();
    return {
      total: workflows.length,
      active: workflows.filter(w => w.status === 'active').length,
      inactive: workflows.filter(w => w.status === 'inactive').length,
      totalNodes: workflows.reduce((sum, w) => sum + w.workflow.nodes.length, 0),
      lastCreated: workflows.length > 0 ? workflows[0].created : null
    };
  }

  private saveWorkflows(workflows: StoredWorkflow[]): void {
    try {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to save workflows to storage:', error);
      throw new Error('Failed to save workflow - storage quota exceeded');
    }
  }
}

// Export singleton instance
export const workflowStorage = new WorkflowStorageService();

import { N8NWorkflow } from '@/types/api'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type WorkflowRow = Database['public']['Tables']['workflows']['Row']
type WorkflowInsert = Database['public']['Tables']['workflows']['Insert']
type WorkflowUpdate = Database['public']['Tables']['workflows']['Update']

export interface StoredWorkflow {
  id: string
  name: string
  description?: string
  workflow: N8NWorkflow
  created: string
  lastUpdated: string
  status: 'active' | 'inactive'
  owner: string
}

export class WorkflowStorageService {
  async getWorkflows(userId: string): Promise<StoredWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return data.map(this.convertToStoredWorkflow)
    } catch (error) {
      console.error('Failed to load workflows from database:', error)
      return []
    }
  }

  async saveWorkflow(
    workflow: N8NWorkflow,
    userId: string,
    name?: string,
    description?: string,
    aiModel?: string,
    generationTimeMs?: number,
    tokensUsed?: number
  ): Promise<StoredWorkflow> {
    try {
      const workflowData: WorkflowInsert = {
        id: workflow.id,
        name: name || workflow.name,
        description: description || `Generated workflow with ${workflow.nodes.length} nodes`,
        workflow_data: workflow,
        owner_id: userId,
        status: 'active',
        ai_model_used: aiModel,
        generation_time_ms: generationTimeMs,
        tokens_used: tokensUsed,
        last_generated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('workflows')
        .insert(workflowData)
        .select()
        .single()

      if (error) throw error

      return this.convertToStoredWorkflow(data)
    } catch (error) {
      console.error('Failed to save workflow:', error)
      throw error
    }
  }

  async updateWorkflow(id: string, userId: string, updates: Partial<StoredWorkflow>): Promise<StoredWorkflow | null> {
    try {
      const updateData: WorkflowUpdate = {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        workflow_data: updates.workflow,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('workflows')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', userId)
        .select()
        .single()

      if (error) throw error

      return this.convertToStoredWorkflow(data)
    } catch (error) {
      console.error('Failed to update workflow:', error)
      throw error
    }
  }

  async deleteWorkflow(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id)
        .eq('owner_id', userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      return false
    }
  }

  async getWorkflow(id: string, userId: string): Promise<StoredWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .eq('owner_id', userId)
        .single()

      if (error) throw error

      return this.convertToStoredWorkflow(data)
    } catch (error) {
      console.error('Failed to get workflow:', error)
      return null
    }
  }

  async exportWorkflow(id: string, userId: string): Promise<void> {
    const storedWorkflow = await this.getWorkflow(id, userId)
    if (!storedWorkflow) {
      throw new Error(`Workflow with id ${id} not found`)
    }

    const { workflow } = storedWorkflow
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
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflow.name.replace(/\s+/g, '_').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async clearAll(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('owner_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to clear workflows:', error)
      throw error
    }
  }

  async getStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('status, workflow_data, created_at')
        .eq('owner_id', userId)

      if (error) throw error

      const workflows = data || []
      return {
        total: workflows.length,
        active: workflows.filter(w => w.status === 'active').length,
        inactive: workflows.filter(w => w.status === 'inactive').length,
        totalNodes: workflows.reduce((sum, w) => sum + (w.workflow_data?.nodes?.length || 0), 0),
        lastCreated: workflows.length > 0 ? workflows[0].created_at : null
      }
    } catch (error) {
      console.error('Failed to get workflow stats:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalNodes: 0,
        lastCreated: null
      }
    }
  }

  private convertToStoredWorkflow(row: WorkflowRow): StoredWorkflow {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      workflow: row.workflow_data,
      created: row.created_at,
      lastUpdated: row.updated_at,
      status: row.status,
      owner: row.owner_id
    }
  }

  async createVersion(
    workflowId: string,
    userId: string,
    versionNumber: number,
    workflowData: N8NWorkflow,
    changesSummary: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_versions')
        .insert({
          workflow_id: workflowId,
          version_number: versionNumber,
          workflow_data: workflowData,
          changes_summary: changesSummary,
          created_by: userId
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to create workflow version:', error)
      throw error
    }
  }

  async getVersions(workflowId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('workflow_versions')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('created_by', userId)
        .order('version_number', { ascending: false })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to get workflow versions:', error)
      return []
    }
  }
}

// Export singleton instance
export const workflowStorage = new WorkflowStorageService();

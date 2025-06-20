export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          workflow_data: any
          tags: string[]
          status: 'active' | 'inactive' | 'archived'
          owner_id: string
          is_public: boolean
          created_at: string
          updated_at: string
          last_generated_at: string | null
          ai_model_used: string | null
          generation_time_ms: number | null
          tokens_used: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          workflow_data: any
          tags?: string[]
          status?: 'active' | 'inactive' | 'archived'
          owner_id: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
          last_generated_at?: string | null
          ai_model_used?: string | null
          generation_time_ms?: number | null
          tokens_used?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          workflow_data?: any
          tags?: string[]
          status?: 'active' | 'inactive' | 'archived'
          owner_id?: string
          is_public?: boolean
          updated_at?: string
          last_generated_at?: string | null
          ai_model_used?: string | null
          generation_time_ms?: number | null
          tokens_used?: number | null
        }
      }
      workflow_versions: {
        Row: {
          id: string
          workflow_id: string
          version_number: number
          workflow_data: any
          changes_summary: string[]
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          workflow_id: string
          version_number: number
          workflow_data: any
          changes_summary?: string[]
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          workflow_id?: string
          version_number?: number
          workflow_data?: any
          changes_summary?: string[]
          created_at?: string
          created_by?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          workflow_id: string | null
          title: string | null
          total_tokens: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workflow_id?: string | null
          title?: string | null
          total_tokens?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workflow_id?: string | null
          title?: string | null
          total_tokens?: number
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          role: 'user' | 'assistant'
          message_type: 'text' | 'workflow' | 'error'
          workflow_data: any | null
          token_count: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          content: string
          role: 'user' | 'assistant'
          message_type?: 'text' | 'workflow' | 'error'
          workflow_data?: any | null
          token_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          content?: string
          role?: 'user' | 'assistant'
          message_type?: 'text' | 'workflow' | 'error'
          workflow_data?: any | null
          token_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

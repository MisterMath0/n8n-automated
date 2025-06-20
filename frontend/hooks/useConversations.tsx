"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { useAuth } from './useAuth'

type ConversationRow = Database['public']['Tables']['conversations']['Row']
type MessageRow = Database['public']['Tables']['messages']['Row']
type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export interface ConversationMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  message_type: 'text' | 'workflow' | 'error'
  workflow_data?: any
  token_count: number
  created_at: string
}

export interface Conversation {
  id: string
  workflow_id?: string
  title?: string
  total_tokens: number
  created_at: string
  updated_at: string
  messages: ConversationMessage[]
}

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent duplicate loads
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  const loadConversations = useCallback(async () => {
    if (!user || isLoadingRef.current) return

    // Skip if already loaded for this user
    if (hasLoadedRef.current && lastUserIdRef.current === user.id) {
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      console.log('Loading conversations for user:', user.id)

      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (conversationError) throw conversationError

      if (!conversationData) {
        setConversations([])
        return
      }

      // Load messages for each conversation
      const conversationsWithMessages = await Promise.all(
        conversationData.map(async (conv) => {
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })

          if (messagesError) {
            console.error(`Failed to load messages for conversation ${conv.id}:`, messagesError)
            return { ...conv, messages: [] }
          }

          return {
            ...conv,
            messages: (messages || []) as ConversationMessage[]
          }
        })
      )

      setConversations(conversationsWithMessages)
      hasLoadedRef.current = true
      lastUserIdRef.current = user.id
      
      // Update current conversation if it exists
      if (currentConversation) {
        const updated = conversationsWithMessages.find(c => c.id === currentConversation.id)
        if (updated) {
          setCurrentConversation(updated)
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
      hasLoadedRef.current = false // Allow retry on error
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [user, currentConversation])

  const createConversation = useCallback(async (
    workflowId?: string,
    title?: string
  ): Promise<Conversation | null> => {
    if (!user) return null

    try {
      const conversationData: ConversationInsert = {
        user_id: user.id,
        workflow_id: workflowId,
        title: title || null,
        total_tokens: 0
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) throw error

      const newConversation: Conversation = {
        ...data,
        messages: []
      }

      setConversations(prev => [newConversation, ...prev])
      return newConversation
    } catch (err) {
      console.error('Failed to create conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
      return null
    }
  }, [user])

  // Force refetch
  const refetch = useCallback(async () => {
    hasLoadedRef.current = false
    await loadConversations()
  }, [loadConversations])

  // Load conversations when user changes
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      loadConversations()
    }
  }, [user?.id]) // Only depend on user.id

  // Simplified API
  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    loading,
    error,
    createConversation,
    refetch,
    
    // Placeholder functions - can be implemented if needed
    addMessage: async () => null,
    deleteConversation: async () => false,
    updateConversationTitle: async () => false,
    updateConversationWorkflow: async () => false,
    getContextMessages: () => []
  }
}

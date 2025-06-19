"use client"

import { useState, useEffect, useCallback } from 'react'
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
  max_context_tokens: number
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

  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (conversationError) throw conversationError

      const conversationsWithMessages = await Promise.all(
        conversationData.map(async (conv) => {
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })

          if (messagesError) throw messagesError

          return {
            ...conv,
            messages: messages as ConversationMessage[]
          }
        })
      )

      setConversations(conversationsWithMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createConversation = useCallback(async (
    workflowId?: string,
    title?: string,
    maxContextTokens: number = 8000
  ): Promise<Conversation | null> => {
    if (!user) return null

    try {
      const conversationData: ConversationInsert = {
        user_id: user.id,
        workflow_id: workflowId,
        title,
        total_tokens: 0,
        max_context_tokens: maxContextTokens
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
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
      console.error('Failed to create conversation:', err)
      return null
    }
  }, [user])

  const addMessage = useCallback(async (
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    messageType: 'text' | 'workflow' | 'error' = 'text',
    workflowData?: any,
    tokenCount: number = 0
  ): Promise<ConversationMessage | null> => {
    if (!user) return null

    try {
      const messageData: MessageInsert = {
        conversation_id: conversationId,
        content,
        role,
        message_type: messageType,
        workflow_data: workflowData,
        token_count: tokenCount
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error

      const newMessage = data as ConversationMessage

      // Get current conversation to update token count
      const currentConv = conversations.find(c => c.id === conversationId) || currentConversation
      if (currentConv) {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            total_tokens: currentConv.total_tokens + tokenCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId)

        if (updateError) throw updateError
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                total_tokens: conv.total_tokens + tokenCount,
                updated_at: new Date().toISOString()
              }
            : conv
        )
      )

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMessage],
                total_tokens: prev.total_tokens + tokenCount,
                updated_at: new Date().toISOString()
              }
            : null
        )
      }

      return newMessage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message')
      console.error('Failed to add message:', err)
      return null
    }
  }, [user, currentConversation, conversations])

  const getContextMessages = useCallback((
    conversation: Conversation,
    maxTokens: number
  ): ConversationMessage[] => {
    const messages = [...conversation.messages].reverse()
    const contextMessages: ConversationMessage[] = []
    let totalTokens = 0

    for (const message of messages) {
      if (totalTokens + message.token_count <= maxTokens) {
        contextMessages.unshift(message)
        totalTokens += message.token_count
      } else {
        break
      }
    }

    return contextMessages
  }, [])

  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error

      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
      console.error('Failed to delete conversation:', err)
      return false
    }
  }, [user, currentConversation])

  const updateConversationTitle = useCallback(async (
    conversationId: string,
    title: string
  ): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, title, updated_at: new Date().toISOString() }
            : conv
        )
      )

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev =>
          prev ? { ...prev, title, updated_at: new Date().toISOString() } : null
        )
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation title')
      console.error('Failed to update conversation title:', err)
      return false
    }
  }, [user, currentConversation])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    loading,
    error,
    createConversation,
    addMessage,
    getContextMessages,
    deleteConversation,
    updateConversationTitle,
    refetch: loadConversations
  }
}

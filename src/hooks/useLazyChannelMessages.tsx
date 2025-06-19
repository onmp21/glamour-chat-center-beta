
import { useState, useEffect, useCallback } from 'react';
import { OptimizedMessageService } from '@/services/OptimizedMessageService';
import { RawMessage } from '@/types/messages';
import { useAuth } from '@/contexts/AuthContext'; // Usar contexto customizado

export const useLazyChannelMessages = (channelId: string | null, conversationId: string | null) => {
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth(); // Usar contexto customizado

  const loadMessages = useCallback(async () => {
    if (!channelId || !conversationId) {
      console.log('📋 [LAZY_MESSAGES] No channelId or conversationId provided, clearing messages');
      setMessages([]);
      return;
    }

    if (!isAuthenticated) {
      console.log('📋 [LAZY_MESSAGES] User not authenticated, skipping message load');
      setError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`📋 [LAZY_MESSAGES] Loading messages for authenticated user: ${user?.name}, channel: ${channelId}, conversation: ${conversationId}`);
      
      const messageService = OptimizedMessageService.getInstance(channelId);
      const result = await messageService.getMessagesByConversation(conversationId, 50);
      
      setMessages(result.data || []);
      
      console.log(`✅ [LAZY_MESSAGES] Successfully loaded ${result.data?.length || 0} messages for user ${user?.name}`);
      
    } catch (err) {
      console.error(`❌ [LAZY_MESSAGES] Error loading messages:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId, isAuthenticated, user]);

  const addMessage = useCallback((message: RawMessage) => {
    console.log(`➕ [LAZY_MESSAGES] Adding new message:`, message.id);
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<RawMessage>) => {
    console.log(`🔄 [LAZY_MESSAGES] Updating message:`, messageId);
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  useEffect(() => {
    if (isAuthenticated && channelId && conversationId) {
      console.log(`🚀 [LAZY_MESSAGES] Effect triggered for authenticated user: ${user?.name}, channel: ${channelId}, conversation: ${conversationId}`);
      loadMessages();
    } else {
      console.log('🚀 [LAZY_MESSAGES] Effect triggered but missing authentication or parameters, clearing state');
      setMessages([]);
      setError(null);
    }
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    addMessage,
    updateMessage,
    refreshMessages: loadMessages
  };
};

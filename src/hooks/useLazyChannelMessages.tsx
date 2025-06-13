
import { useState, useEffect, useCallback } from 'react';
import { MessageServiceV2 } from '@/services/MessageServiceV2';
import { RawMessage } from '@/types/messages';

export const useLazyChannelMessages = (channelId: string | null, conversationId: string | null) => {
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!channelId || !conversationId) {
      console.log('📋 [LAZY_MESSAGES] No channelId or conversationId provided, clearing messages');
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`📋 [LAZY_MESSAGES] Loading messages for channel: ${channelId}, conversation: ${conversationId}`);
      
      const messageService = new MessageServiceV2(channelId);
      const result = await messageService.getMessagesByConversation(conversationId, 50);
      
      setMessages(result.data);
      
      console.log(`✅ [LAZY_MESSAGES] Successfully loaded ${result.data.length} messages`);
      
      // Iniciar otimização em background
      messageService.processBackgroundOptimization();
      
    } catch (err) {
      console.error(`❌ [LAZY_MESSAGES] Error loading messages:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

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
    if (channelId && conversationId) {
      console.log(`🚀 [LAZY_MESSAGES] Effect triggered for channel: ${channelId}, conversation: ${conversationId}`);
      loadMessages();
    } else {
      console.log('🚀 [LAZY_MESSAGES] Effect triggered but missing parameters, clearing state');
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

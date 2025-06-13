
import { useState, useEffect, useCallback } from 'react';
import { OptimizedConversationService } from '@/services/OptimizedConversationService';
import { ChannelConversation } from '@/types/messages';

export const useLazyConversationsList = (channelId: string | null) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!channelId) {
      setConversations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`📋 [LAZY_CONVERSATIONS] Loading conversations for ${channelId}`);
      
      const conversations = await OptimizedConversationService.getConversationsList(channelId, 20);
      setConversations(conversations);
      
      console.log(`✅ [LAZY_CONVERSATIONS] Loaded ${conversations.length} conversations for ${channelId}`);
    } catch (err) {
      console.error(`❌ [LAZY_CONVERSATIONS] Error loading conversations for ${channelId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Só carrega conversas quando há um canal ativo
  useEffect(() => {
    if (channelId) {
      loadConversations();
    } else {
      setConversations([]);
      setError(null);
    }
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations
  };
};

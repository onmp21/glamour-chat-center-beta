
import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from '@/types/messages';

export const useLazyConversationsList = (channelId: string | null) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!channelId) {
      console.log('📋 [LAZY_CONVERSATIONS] No channelId provided, clearing conversations');
      setConversations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`📋 [LAZY_CONVERSATIONS] Loading conversations for channel: ${channelId}`);
      
      const messageService = new MessageService(channelId);
      const conversations = await messageService.getConversations(20);
      setConversations(conversations);
      
      console.log(`✅ [LAZY_CONVERSATIONS] Successfully loaded ${conversations.length} conversations for ${channelId}`);
      
      if (conversations.length === 0) {
        console.log(`⚠️ [LAZY_CONVERSATIONS] No conversations found for channel ${channelId}. This might be normal if the channel is new or has no messages.`);
      }
    } catch (err) {
      console.error(`❌ [LAZY_CONVERSATIONS] Error loading conversations for ${channelId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar conversas');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Só carrega conversas quando há um canal ativo
  useEffect(() => {
    if (channelId) {
      console.log(`🚀 [LAZY_CONVERSATIONS] Effect triggered for channelId: ${channelId}`);
      loadConversations();
    } else {
      console.log('🚀 [LAZY_CONVERSATIONS] Effect triggered but no channelId, clearing state');
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


import { useState, useEffect } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from './useChannelConversations';

export const useConversationService = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async (isRefresh = false) => {
    if (!channelId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const messageService = new MessageService(channelId);
      const loadedConversations = await messageService.getConversations();
      
      setConversations(loadedConversations);
    } catch (err) {
      console.error(`❌ [CONVERSATION_SERVICE_HOOK] Error loading conversations:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshConversations = () => {
    loadConversations(true);
  };

  const updateConversationStatus = async (
    conversationId: string, 
    status: 'unread' | 'in_progress' | 'resolved'
  ) => {
    try {
      // Salvar status no localStorage
      const statusKey = `conversation_status_${channelId}_${conversationId}`;
      localStorage.setItem(statusKey, status);

      // Marcar como lido se necessário
      if (status === 'in_progress' || status === 'resolved') {
        const messageService = new MessageService(channelId);
        await messageService.markConversationAsRead(conversationId);
      }

      // Atualizar estado local
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, status }
          : conv
      ));
    } catch (error) {
      console.error('❌ [CONVERSATION_SERVICE_HOOK] Error updating status:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadConversations();

    // Setup realtime subscription with proper cleanup
    let channel: any = null;

    if (channelId) {
      const messageService = new MessageService(channelId);
      channel = messageService.createRealtimeSubscription((payload) => {
        console.log(`🔴 [CONVERSATION_SERVICE_HOOK] New message via realtime:`, payload);
        // Refresh conversations when new message arrives
        setTimeout(() => {
          refreshConversations();
        }, 1000);
      }, `-service-${Date.now()}`);

      channel.subscribe();
    }

    return () => {
      if (channel) {
        console.log(`🔌 [CONVERSATION_SERVICE_HOOK] Unsubscribing from channel ${channelId}`);
        channel.unsubscribe();
      }
    };
  }, [channelId]);

  return {
    conversations,
    loading,
    refreshing,
    error,
    refreshConversations,
    updateConversationStatus
  };
};

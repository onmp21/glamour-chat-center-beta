
import { useState, useEffect, useRef } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from './useChannelConversations';

export const useConversationService = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);

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

    // Setup realtime subscription with proper cleanup - only if not already subscribed
    let channelSuffix = '';

    if (channelId && !isSubscribedRef.current) {
      const messageService = new MessageService(channelId);
      channelSuffix = `-service-${channelId}-${Date.now()}`;
      
      try {
        const channel = messageService.createRealtimeSubscription((payload) => {
          console.log(`🔴 [CONVERSATION_SERVICE_HOOK] New message via realtime:`, payload);
          // Refresh conversations when new message arrives
          setTimeout(() => {
            refreshConversations();
          }, 1000);
        }, channelSuffix);

        channelRef.current = channel;

        // Subscribe only once
        channel.subscribe((status: string) => {
          console.log(`🔌 [CONVERSATION_SERVICE_HOOK] Subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
          }
        });
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    }

    return () => {
      if (channelRef.current && channelSuffix && isSubscribedRef.current) {
        console.log(`🔌 [CONVERSATION_SERVICE_HOOK] Unsubscribing from channel ${channelId}`);
        try {
          const messageService = new MessageService(channelId);
          const repository = messageService['getRepository']();
          const tableName = repository.getTableName();
          MessageService.unsubscribeChannel(channelSuffix, tableName);
        } catch (error) {
          console.error('Error cleaning up subscription:', error);
        }
        isSubscribedRef.current = false;
        channelRef.current = null;
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

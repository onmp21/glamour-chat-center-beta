
import { useState, useEffect, useRef } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from './useChannelConversations';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationService = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionNameRef = useRef<string | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

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

    // Setup realtime subscription only if not already subscribed
    if (channelId && !isSubscribedRef.current && !isInitializingRef.current) {
      isInitializingRef.current = true;
      const tableName = getTableNameForChannelSync(channelId);
      const subscriptionName = `service-${channelId}-${Date.now()}`;
      subscriptionNameRef.current = subscriptionName;
      
      const setupSubscription = async () => {
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          
          await subscriptionManager.createSubscription(
            subscriptionName,
            (payload) => {
              console.log(`🔴 [CONVERSATION_SERVICE_HOOK] New message via realtime:`, payload);
              // Refresh conversations when new message arrives
              setTimeout(() => {
                refreshConversations();
              }, 1000);
            },
            tableName
          );

          isSubscribedRef.current = true;
        } catch (error) {
          console.error('❌ [CONVERSATION_SERVICE_HOOK] Error setting up subscription:', error);
        } finally {
          isInitializingRef.current = false;
        }
      };

      setupSubscription();
    }

    return () => {
      if (subscriptionNameRef.current && isSubscribedRef.current) {
        console.log(`🔌 [CONVERSATION_SERVICE_HOOK] Unsubscribing from channel ${channelId}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(subscriptionNameRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_SERVICE_HOOK] Error cleaning up subscription:', error);
        }
        isSubscribedRef.current = false;
        subscriptionNameRef.current = null;
      }
      isInitializingRef.current = false;
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

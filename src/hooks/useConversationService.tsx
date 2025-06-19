
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from './useChannelConversations';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationService = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriberIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const loadConversations = useCallback(async (isRefresh = false) => {
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
      
      if (mountedRef.current) {
        setConversations(loadedConversations);
      }
    } catch (err) {
      console.error(`❌ [CONVERSATION_SERVICE_HOOK] Error loading conversations:`, err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setConversations([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [channelId]);

  const refreshConversations = useCallback(() => {
    loadConversations(true);
  }, [loadConversations]);

  const updateConversationStatus = async (
    conversationId: string, 
    status: 'unread' | 'in_progress' | 'resolved'
  ) => {
    try {
      const statusKey = `conversation_status_${channelId}_${conversationId}`;
      localStorage.setItem(statusKey, status);

      if (status === 'in_progress' || status === 'resolved') {
        const messageService = new MessageService(channelId);
        await messageService.markConversationAsRead(conversationId);
      }

      if (mountedRef.current) {
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status }
            : conv
        ));
      }
    } catch (error) {
      console.error('❌ [CONVERSATION_SERVICE_HOOK] Error updating status:', error);
      throw error;
    }
  };

  const realtimeCallback = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    console.log(`🔴 [CONVERSATION_SERVICE_HOOK] New message via realtime:`, payload);
    
    setTimeout(() => {
      if (mountedRef.current) {
        refreshConversations();
      }
    }, 500);
  }, [refreshConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!channelId) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[CONVERSATION_SERVICE_HOOK] No table mapping found for channel: ${channelId}`);
      return;
    }

    const setupSubscription = async () => {
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        const subscriberId = await subscriptionManager.subscribe(tableName, realtimeCallback);
        
        if (mountedRef.current) {
          subscriberIdRef.current = subscriberId;
          console.log(`✅ [CONVERSATION_SERVICE_HOOK] Connected to ${tableName} with ID ${subscriberId}`);
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_SERVICE_HOOK] Error setting up subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      
      if (subscriberIdRef.current) {
        console.log(`🔌 [CONVERSATION_SERVICE_HOOK] Unsubscribing ${subscriberIdRef.current}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.unsubscribe(tableName, subscriberIdRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_SERVICE_HOOK] Error cleaning up subscription:', error);
        }
      }
    };
  }, [channelId, realtimeCallback]);

  return {
    conversations,
    loading,
    refreshing,
    error,
    refreshConversations,
    updateConversationStatus
  };
};


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
  const callbackRef = useRef<((payload: any) => void) | null>(null);
  const tableNameRef = useRef<string | null>(null);
  const isSetupRef = useRef(false);

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
  }, [channelId]);

  useEffect(() => {
    if (!channelId || isSetupRef.current) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[CONVERSATION_SERVICE_HOOK] No table mapping found for channel: ${channelId}`);
      return;
    }

    tableNameRef.current = tableName;
    isSetupRef.current = true;
    
    const callback = (payload: any) => {
      console.log(`🔴 [CONVERSATION_SERVICE_HOOK] New message via realtime:`, payload);
      // Refresh conversations when new message arrives
      setTimeout(() => {
        refreshConversations();
      }, 1000);
    };

    callbackRef.current = callback;

    const setupSubscription = async () => {
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        await subscriptionManager.createSubscription(tableName, callback);
        console.log(`✅ [CONVERSATION_SERVICE_HOOK] Connected to ${tableName}`);
      } catch (error) {
        console.error('❌ [CONVERSATION_SERVICE_HOOK] Error setting up subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (tableNameRef.current && callbackRef.current) {
        console.log(`🔌 [CONVERSATION_SERVICE_HOOK] Unsubscribing from table ${tableNameRef.current}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(tableNameRef.current, callbackRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_SERVICE_HOOK] Error cleaning up subscription:', error);
        }
      }
      isSetupRef.current = false;
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

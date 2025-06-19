
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { ChannelConversation, ChannelMessage } from '@/types/messages';
import { DetailedLogger } from '@/services/DetailedLogger';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useChannelConversationsRefactored = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackRef = useRef<((payload: any) => void) | null>(null);
  const tableNameRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (!channelId) {
      DetailedLogger.warn('useChannelConversationsRefactored', 'Nenhum channelId fornecido');
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        DetailedLogger.info('useChannelConversationsRefactored', `Atualização manual para o canal: ${channelId}`);
      } else {
        setLoading(true);
      }
      setError(null);

      DetailedLogger.info('useChannelConversationsRefactored', `Carregando conversas para o canal: ${channelId}`);

      const channelService = new ChannelService(channelId);
      const conversations = await channelService.getConversations();

      if (mountedRef.current) {
        DetailedLogger.info('useChannelConversationsRefactored', `Conversas carregadas com sucesso`, { count: conversations.length });
        setConversations(conversations);
      }
    } catch (err) {
      DetailedLogger.error('useChannelConversationsRefactored', `Erro ao carregar conversas para o canal ${channelId}`, { error: err });
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
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
    DetailedLogger.info('useChannelConversationsRefactored', `Atualização manual acionada para o canal: ${channelId}`);
    loadConversations(true);
  }, [channelId, loadConversations]);

  // Memoizar o callback do realtime
  const realtimeCallback = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    DetailedLogger.info("useChannelConversationsRefactored", `Nova mensagem via realtime:`, payload);
    // Recarregar conversas para refletir as novas mensagens
    loadConversations();
  }, [loadConversations]);

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
      DetailedLogger.warn('useChannelConversationsRefactored', `No table mapping found for channel: ${channelId}`);
      return;
    }

    tableNameRef.current = tableName;
    callbackRef.current = realtimeCallback;

    const setupSubscription = async () => {
      if (!mountedRef.current) return;
      
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        await subscriptionManager.createSubscription(tableName, realtimeCallback);
        DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription iniciado para o canal ${channelId}`);
      } catch (error) {
        DetailedLogger.error("useChannelConversationsRefactored", `Erro ao crear subscription:`, error);
      }
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      
      if (tableNameRef.current && callbackRef.current) {
        DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription interrompido para o canal ${channelId}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(tableNameRef.current, callbackRef.current);
        } catch (error) {
          DetailedLogger.error("useChannelConversationsRefactored", `Erro ao fazer cleanup do realtime subscription:`, error);
        }
      }
    };
  }, [channelId, realtimeCallback]);

  return {
    conversations,
    loading,
    refreshing,
    error,
    refreshConversations
  };
};

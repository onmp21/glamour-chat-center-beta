
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from '@/types/messages';
import { DetailedLogger } from '@/services/DetailedLogger';

export const useChannelConversationsRefactored = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current channel suffix and subscription instance
  const channelSuffixRef = useRef<string>();
  const subscriptionInstanceRef = useRef<any>(null);

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

      DetailedLogger.info('useChannelConversationsRefactored', `Conversas carregadas com sucesso`, { count: conversations.length });
      setConversations(conversations);
    } catch (err) {
      DetailedLogger.error('useChannelConversationsRefactored', `Erro ao carregar conversas para o canal ${channelId}`, { error: err });
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [channelId]);

  const refreshConversations = useCallback(() => {
    DetailedLogger.info('useChannelConversationsRefactored', `Atualização manual acionada para o canal: ${channelId}`);
    loadConversations(true);
  }, [channelId, loadConversations]);

  useEffect(() => {
    let unsubscribed = false;
    // CLEANUP BEFORE CREATE: Always cleanup first
    if (subscriptionInstanceRef.current) {
      DetailedLogger.info("useChannelConversationsRefactored", "Cleanup before new effect run: Unsubscribing previous instance.");
      try {
        if (subscriptionInstanceRef.current.unsubscribe) {
          subscriptionInstanceRef.current.unsubscribe();
        }
      } catch (_e) {}
      try {
        if (channelSuffixRef.current) {
          const messageService = new MessageService(channelId);
          const repository = messageService['getRepository']();
          const tableName = repository.getTableName();
          MessageService.unsubscribeChannel(channelSuffixRef.current, tableName);
        }
      } catch (_e) {}
      subscriptionInstanceRef.current = null;
      channelSuffixRef.current = undefined;
    }

    loadConversations();

    // Only create a new subscription if channelId is valid
    if (channelId) {
      // Generate a truly unique suffix for each run
      channelSuffixRef.current = `-conversations-${Math.random().toString(36).substr(2, 8)}-${Date.now()}`;
      const channelSuffix = channelSuffixRef.current;

      const messageService = new MessageService(channelId);
      const channel = messageService.createRealtimeSubscription(
        (payload) => {
          DetailedLogger.info("useChannelConversationsRefactored", `Nova mensagem via realtime:`, payload);
          if (!unsubscribed) loadConversations();
        },
        channelSuffix
      );
      subscriptionInstanceRef.current = channel;
      DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription criado para ${channelId} (suffix: ${channelSuffix})`);
    }

    return () => {
      unsubscribed = true;
      if (subscriptionInstanceRef.current && channelId && channelSuffixRef.current) {
        DetailedLogger.info("useChannelConversationsRefactored", `Cleanup: Unsubscribing realtime for canal ${channelId} (suffix: ${channelSuffixRef.current})`);
        try {
          const messageService = new MessageService(channelId);
          const repository = messageService['getRepository']();
          const tableName = repository.getTableName();
          MessageService.unsubscribeChannel(channelSuffixRef.current, tableName);
        } catch (_e) {}
        try {
          if (subscriptionInstanceRef.current.unsubscribe) {
            subscriptionInstanceRef.current.unsubscribe();
          }
        } catch (_e) {}
        subscriptionInstanceRef.current = null;
        channelSuffixRef.current = undefined;
      }
    };
  }, [channelId, loadConversations]);

  return {
    conversations,
    loading,
    refreshing,
    error,
    refreshConversations
  };
};

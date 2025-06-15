
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation } from '@/types/messages';
import { DetailedLogger } from '@/services/DetailedLogger';

// We want to guarantee: NO channel instance is ever reused across effect runs
export const useChannelConversationsRefactored = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Channel instance & suffix refs to support safe cleanup
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

    // --- DEFENSIVE CLEANUP: always remove old channel instance,
    //                        suppressing ALL errors.
    if (subscriptionInstanceRef.current) {
      DetailedLogger.info("useChannelConversationsRefactored", "Cleanup before useEffect: Ensuring previous channel is removed.");
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
      try {
        // Defensive: forcibly remove from supabase if possible
        if (subscriptionInstanceRef.current && typeof subscriptionInstanceRef.current === "object" && subscriptionInstanceRef.current.constructor?.name?.toLowerCase().includes("realtime")) {
          // supabase.removeChannel(instance) would be called inside MessageService.unsubscribeChannel
        }
      } catch (_e) {}
      subscriptionInstanceRef.current = null;
      channelSuffixRef.current = undefined;
    }

    loadConversations();

    // --- CREATE NEW SUBSCRIPTION
    if (channelId) {
      // Always use a unique suffix for every new useEffect run
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
      // --- REALLY REMOVE subscription & channel refs
      if (subscriptionInstanceRef.current && channelId && channelSuffixRef.current) {
        DetailedLogger.info("useChannelConversationsRefactored", `Cleanup on unmount: Unsubscribing realtime for canal ${channelId} (suffix: ${channelSuffixRef.current})`);
        try {
          // channelSuffixRef must be passed, never an empty string
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

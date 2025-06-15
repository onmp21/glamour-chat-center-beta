
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

  // UseRef para armazenar o mesmo sufixo e canal durante o ciclo de vida do hook
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
    loadConversations();

    let unsubscribed = false;

    if (channelId) {
      // Gere o sufixo UMA vez só por ciclo de hook/canal
      if (!channelSuffixRef.current) {
        channelSuffixRef.current = `-conversations-${Math.random().toString(36).substr(2, 8)}`;
      }
      const channelSuffix = channelSuffixRef.current;

      // Limpa qualquer canal anterior ANTES de criar outro
      if (subscriptionInstanceRef.current && subscriptionInstanceRef.current.unsubscribe) {
        try {
          DetailedLogger.info("useChannelConversationsRefactored", "Cleanup: Unsubscribing previous channel instance before creating a new one");
          subscriptionInstanceRef.current.unsubscribe();
        } catch (_e) {}
      }

      const messageService = new MessageService(channelId);
      const channel = messageService.createRealtimeSubscription(
        (payload) => {
          DetailedLogger.info("useChannelConversationsRefactored", `Nova mensagem via realtime:`, payload);
          if (!unsubscribed) {
            loadConversations();
          }
        }, 
        channelSuffix
      );

      subscriptionInstanceRef.current = channel;

      DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription iniciado para o canal ${channelId} (sufixo: ${channelSuffix})`);
    }

    return () => {
      unsubscribed = true;
      if (subscriptionInstanceRef.current && channelId && channelSuffixRef.current) {
        DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription interrompido para o canal ${channelId}`);
        const messageService = new MessageService(channelId);
        const repository = messageService['getRepository']();
        const tableName = repository.getTableName();
        MessageService.unsubscribeChannel(channelSuffixRef.current, tableName);
        // Também tenta chamar unsubscribe no objeto se existir
        if (subscriptionInstanceRef.current.unsubscribe) {
          try {
            subscriptionInstanceRef.current.unsubscribe();
          } catch (_e) {}
        }
        channelSuffixRef.current = undefined; // Libera o ref para nova inscrição futura
        subscriptionInstanceRef.current = null;
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

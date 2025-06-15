
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

  // UseRef para armazenar o mesmo sufixo durante o ciclo de vida do hook
  const channelSuffixRef = useRef<string>();

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

    let channel: any = null;

    if (channelId) {
      // Gere o sufixo UMA vez só por ciclo de efeito
      if (!channelSuffixRef.current) {
        channelSuffixRef.current = `-conversations-${Math.random().toString(36).substr(2, 8)}`;
      }
      const channelSuffix = channelSuffixRef.current;

      const messageService = new MessageService(channelId);
      channel = messageService.createRealtimeSubscription((payload) => {
        DetailedLogger.info("useChannelConversationsRefactored", `Nova mensagem via realtime:`, payload);
        loadConversations();
      }, channelSuffix);

      DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription iniciado para o canal ${channelId} (sufixo: ${channelSuffix})`);
    }

    return () => {
      if (channel && channelId && channelSuffixRef.current) {
        DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription interrompido para o canal ${channelId}`);
        const messageService = new MessageService(channelId);
        const repository = messageService['getRepository']();
        const tableName = repository.getTableName();
        // Remova o mesmo canal criado!
        MessageService.unsubscribeChannel(channelSuffixRef.current, tableName);
        channelSuffixRef.current = undefined; // Libera o ref para nova inscrição futura
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

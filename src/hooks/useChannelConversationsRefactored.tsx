
import { useState, useEffect, useCallback } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { MessageService } from '@/services/MessageService';
import { ChannelConversation, ChannelMessage } from '@/types/messages';
import { DetailedLogger } from '@/services/DetailedLogger';

export const useChannelConversationsRefactored = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    let channelSuffix = '';

    if (channelId) {
      const messageService = new MessageService(channelId);
      channelSuffix = `-conversations-${channelId}-${Date.now()}`;
      
      try {
        channel = messageService.createRealtimeSubscription((payload) => {
          DetailedLogger.info("useChannelConversationsRefactored", `Nova mensagem via realtime:`, payload);
          // Recarregar conversas para refletir as novas mensagens
          loadConversations();
        }, channelSuffix);

        // Subscribe only once
        channel.subscribe((status: string) => {
          console.log(`🔌 [CONVERSATIONS_REFACTORED] Subscription status: ${status}`);
        });
        
        DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription iniciado para o canal ${channelId}`);
      } catch (error) {
        DetailedLogger.error("useChannelConversationsRefactored", `Erro ao criar subscription:`, error);
      }
    }

    return () => {
      if (channel && channelSuffix) {
        DetailedLogger.info("useChannelConversationsRefactored", `Realtime subscription interrompido para o canal ${channelId}`);
        try {
          const messageService = new MessageService(channelId);
          const repository = messageService['getRepository']();
          const tableName = repository.getTableName();
          MessageService.unsubscribeChannel(channelSuffix, tableName);
        } catch (error) {
          DetailedLogger.error("useChannelConversationsRefactored", `Erro ao fazer cleanup do realtime subscription:`, error);
        }
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

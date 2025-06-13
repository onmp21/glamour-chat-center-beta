
import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';
import { MessageConverter } from '@/utils/MessageConverter';
import { MessageSorter } from '@/utils/MessageSorter';
import { DetailedLogger } from '@/services/DetailedLogger';

export const useChannelMessagesRefactored = (channelId: string, conversationId?: string) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!channelId) {
      DetailedLogger.warn('useChannelMessagesRefactored', 'Nenhum channelId fornecido');
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      DetailedLogger.info('useChannelMessagesRefactored', `Carregando mensagens para o canal: ${channelId}, conversa: ${conversationId}`);

      const messageService = new MessageService(channelId);
      
      let loadedMessages: ChannelMessage[];
      if (conversationId) {
        const result = await messageService.getMessagesByConversation(conversationId);
        loadedMessages = result.data;
      } else {
        loadedMessages = await messageService.getAllMessages();
      }

      const sortedMessages = MessageSorter.sortChannelMessages(loadedMessages);
      
      DetailedLogger.info('useChannelMessagesRefactored', `Carregadas ${sortedMessages.length} mensagens`);
      setMessages(sortedMessages);
    } catch (err) {
      DetailedLogger.error('useChannelMessagesRefactored', `Erro ao carregar mensagens`, { error: err });
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  const addMessage = useCallback((newMessage: RawMessage) => {
    setMessages(prevMessages => {
      const processedMessage = MessageConverter.rawToChannelMessage(newMessage);
      
      if (MessageConverter.isDuplicate(prevMessages, processedMessage)) {
        DetailedLogger.warn('useChannelMessagesRefactored', `Mensagem com ID ${processedMessage.id} já existe, ignorando.`);
        return prevMessages;
      }

      DetailedLogger.info('useChannelMessagesRefactored', `Adicionando nova mensagem ao estado:`, processedMessage);
      return MessageSorter.sortChannelMessages([...prevMessages, processedMessage]);
    });
  }, []);

  useEffect(() => {
    loadMessages();

    let channel: any = null;

    if (channelId) {
      const messageService = new MessageService(channelId);
      const channelSuffix = conversationId ? `-${conversationId}-${Date.now()}` : `-messages-${Date.now()}`;
      
      channel = messageService.createRealtimeSubscription((payload) => {
        DetailedLogger.info("useChannelMessagesRefactored", `Nova mensagem via realtime:`, payload);
        
        if (conversationId) {
          const messagePhone = messageService.extractPhoneFromSessionId(payload.new.session_id);
          if (messagePhone !== conversationId) {
            DetailedLogger.info("useChannelMessagesRefactored", `Mensagem não é para a conversa atual, ignorando`);
            return;
          }
        }
        
        addMessage(payload.new as RawMessage);
      }, channelSuffix);

      channel.subscribe();
      DetailedLogger.info("useChannelMessagesRefactored", `Realtime subscription iniciado para o canal ${channelId}`);
    }

    return () => {
      if (channel) {
        DetailedLogger.info("useChannelMessagesRefactored", `Realtime subscription interrompido para o canal ${channelId}`);
        channel.unsubscribe();
      }
    };
  }, [channelId, conversationId, loadMessages, addMessage]);

  return {
    messages,
    loading,
    error,
    refreshMessages: loadMessages,
    addMessage
  };
};

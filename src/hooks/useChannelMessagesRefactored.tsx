
import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';

export const useChannelMessagesRefactored = (channelId: string, conversationId?: string) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertRawToChannelMessage = (raw: RawMessage): ChannelMessage => {
    return {
      id: raw.id.toString(),
      content: raw.content,
      sender: raw.sender,
      timestamp: raw.timestamp,
      type: 'text',
      isFromUser: raw.sender === 'customer',
      session_id: raw.session_id,
      tipo_remetente: raw.tipo_remetente,
      mensagemtype: raw.mensagemtype,
      Nome_do_contato: raw.Nome_do_contato,
      nome_do_contato: raw.nome_do_contato
    };
  };

  const loadMessages = useCallback(async () => {
    if (!channelId) return;

    try {
      setLoading(true);
      const messageService = new MessageService(channelId);
      
      let rawMessages: RawMessage[];
      if (conversationId) {
        rawMessages = await messageService.getMessagesByConversation(conversationId) || [];
      } else {
        rawMessages = await messageService.getAllMessages() || [];
      }

      const convertedMessages = rawMessages.map(convertRawToChannelMessage);
      setMessages(convertedMessages);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  useEffect(() => {
    loadMessages();
    
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const addMessage = useCallback((newMessage: RawMessage) => {
    const convertedMessage = convertRawToChannelMessage(newMessage);
    setMessages(prev => [...prev, convertedMessage]);
  }, []);

  return {
    messages,
    loading,
    error,
    refetch: loadMessages,
    addMessage
  };
};

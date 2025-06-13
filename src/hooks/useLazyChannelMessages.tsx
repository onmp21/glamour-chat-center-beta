
import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';

export const useLazyChannelMessages = (channelId: string | null, conversationId?: string) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (!channelId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`📬 [LAZY_MESSAGES] Loading messages for ${channelId}, conversation: ${conversationId}`);
      
      const messageService = new MessageService(channelId);
      
      let result: RawMessage[] | { data: RawMessage[] };
      if (conversationId) {
        result = await messageService.getMessagesByConversation(conversationId);
      } else {
        result = await messageService.getAllMessages(50);
      }

      const rawMessages = Array.isArray(result) ? result : (result?.data || []);
      const convertedMessages = rawMessages.map(convertRawToChannelMessage);
      
      setMessages(convertedMessages);
      console.log(`✅ [LAZY_MESSAGES] Loaded ${convertedMessages.length} messages for ${channelId}`);
    } catch (err) {
      console.error(`❌ [LAZY_MESSAGES] Error loading messages for ${channelId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  // Só carrega mensagens quando há um canal ativo
  useEffect(() => {
    if (channelId) {
      loadMessages();
    } else {
      setMessages([]);
      setError(null);
    }
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

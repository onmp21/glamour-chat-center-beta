
import { useQuery } from '@tanstack/react-query';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';

export interface UseChannelMessagesResult {
  messages: ChannelMessage[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

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

export const useChannelMessages = (channelId: string, conversationId?: string): UseChannelMessagesResult => {
  const {
    data: result,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['channel-messages', channelId, conversationId],
    queryFn: async () => {
      const messageService = new MessageService(channelId);
      if (conversationId) {
        const result = await messageService.getMessagesByConversation(conversationId);
        const rawMessages = Array.isArray(result) ? result : (result?.data || []);
        return rawMessages.map(convertRawToChannelMessage);
      }
      const result = await messageService.getAllMessages();
      const rawMessages = Array.isArray(result) ? result : (result?.data || []);
      return rawMessages.map(convertRawToChannelMessage);
    },
    refetchInterval: 5000,
  });

  return {
    messages: result || [],
    loading,
    error: error as Error | null,
    refetch,
  };
};

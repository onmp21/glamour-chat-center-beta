
import { useQuery } from '@tanstack/react-query';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage } from '@/types/messages';

export interface UseChannelMessagesResult {
  messages: ChannelMessage[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useChannelMessages = (channelId: string, conversationId?: string): UseChannelMessagesResult => {
  const {
    data: messages = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['channel-messages', channelId, conversationId],
    queryFn: async () => {
      const messageService = new MessageService(channelId);
      if (conversationId) {
        return await messageService.getMessagesByConversation(conversationId);
      }
      return await messageService.getAllMessages();
    },
    refetchInterval: 5000,
  });

  return {
    messages,
    loading,
    error: error as Error | null,
    refetch,
  };
};

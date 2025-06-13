
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
        return Array.isArray(result) ? result : result?.data || [];
      }
      const result = await messageService.getAllMessages();
      return Array.isArray(result) ? result : result?.data || [];
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

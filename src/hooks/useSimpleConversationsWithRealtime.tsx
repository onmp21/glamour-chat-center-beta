
import { useRealtimeConversations } from './useRealtimeConversations';

// Wrapper hook to maintain compatibility with existing code
export const useSimpleConversationsWithRealtime = (channelId: string | null) => {
  return useRealtimeConversations(channelId);
};

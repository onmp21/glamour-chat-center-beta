
import { useRealtimeConversations } from './useRealtimeConversations';

// Wrapper hook simplificado para manter compatibilidade
export const useSimpleConversationsWithRealtime = (channelId: string | null) => {
  return useRealtimeConversations(channelId);
};

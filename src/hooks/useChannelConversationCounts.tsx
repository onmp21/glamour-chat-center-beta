
import { useState, useEffect } from 'react';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';
import { useConversationStatus } from '@/hooks/useConversationStatus';

interface ConversationCounts {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export const useChannelConversationCounts = (channelId: string) => {
  const { conversations, loading } = useChannelConversationsRefactored(channelId);
  const { getConversationStatus } = useConversationStatus();
  const [counts, setCounts] = useState<ConversationCounts>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    if (!loading && conversations.length > 0) {
      let pending = 0;
      let inProgress = 0;
      let resolved = 0;

      conversations.forEach(conversation => {
        const status = getConversationStatus(channelId, conversation.id);
        switch (status) {
          case 'unread':
            pending++;
            break;
          case 'in_progress':
            inProgress++;
            break;
          case 'resolved':
            resolved++;
            break;
        }
      });

      setCounts({
        total: conversations.length,
        pending,
        inProgress,
        resolved
      });
    } else if (!loading) {
      setCounts({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    }
  }, [conversations, loading, channelId, getConversationStatus]);

  return { counts, loading };
};

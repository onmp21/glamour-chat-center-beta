
import { useState, useEffect } from 'react';
import { useGlobalConversationStats } from '@/contexts/GlobalConversationStatsContext';

interface ChannelStats {
  totalConversations: number;
  unreadMessages: number;
  loading: boolean;
  error: string | null;
}

export const useOptimizedChannelStats = (channelId: string | null) => {
  // Use ONLY the global context - no direct subscriptions
  const { getChannelStats, isInitialized } = useGlobalConversationStats();
  
  const [stats, setStats] = useState<ChannelStats>({
    totalConversations: 0,
    unreadMessages: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!channelId) {
      setStats({
        totalConversations: 0,
        unreadMessages: 0,
        loading: false,
        error: null
      });
      return;
    }

    // Get stats from global context
    const globalStats = getChannelStats(channelId);
    
    setStats({
      totalConversations: globalStats.totalConversations,
      unreadMessages: globalStats.unreadMessages,
      loading: !isInitialized,
      error: globalStats.error
    });

    console.log(`📊 [OPTIMIZED_CHANNEL_STATS] Channel ${channelId} stats from global context:`, {
      conversations: globalStats.totalConversations,
      unread: globalStats.unreadMessages
    });

  }, [channelId, getChannelStats, isInitialized]);

  return stats;
};

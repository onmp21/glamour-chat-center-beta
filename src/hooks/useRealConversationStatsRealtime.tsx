
import { useState, useEffect } from 'react';
import { useGlobalConversationStats } from '@/contexts/GlobalConversationStatsContext';

interface ConversationStatsRealtime {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export const useRealConversationStatsRealtime = () => {
  const { getTotalStats, isInitialized } = useGlobalConversationStats();
  const [stats, setStats] = useState<ConversationStatsRealtime>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const totalStats = getTotalStats();
    
    setStats({
      total: totalStats.total,
      pending: totalStats.pending,
      inProgress: totalStats.inProgress,
      resolved: totalStats.resolved
    });
    
    setLoading(totalStats.loading || !isInitialized);
  }, [getTotalStats, isInitialized]);

  return { stats, loading };
};

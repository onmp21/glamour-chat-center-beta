
import { useEffect } from 'react';

interface UseAutoRefreshProps {
  enabled: boolean;
  channelId?: string;
  onRefresh: () => void;
  intervalMs?: number;
}

export const useAutoRefresh = ({ 
  enabled, 
  channelId, 
  onRefresh, 
  intervalMs = 60000 
}: UseAutoRefreshProps) => {
  useEffect(() => {
    if (!enabled || !channelId) return;

    console.log(`🔄 [AUTO-REFRESH] Setting up auto refresh for channel ${channelId} every ${intervalMs}ms`);

    const interval = setInterval(() => {
      console.log(`🔄 [AUTO-REFRESH] Auto refresh - loading conversations for channel ${channelId}...`);
      onRefresh();
    }, intervalMs);

    return () => {
      console.log(`🔴 [AUTO-REFRESH] Clearing auto refresh for channel ${channelId}`);
      clearInterval(interval);
    };
  }, [enabled, channelId, onRefresh, intervalMs]);
};

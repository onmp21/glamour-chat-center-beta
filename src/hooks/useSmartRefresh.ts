
import { useEffect, useRef, useCallback } from 'react';

interface SmartRefreshConfig {
  enabled: boolean;
  channelId?: string;
  onRefresh: () => Promise<void>;
  baseInterval?: number;
  maxInterval?: number;
  backoffMultiplier?: number;
}

export const useSmartRefresh = ({
  enabled,
  channelId,
  onRefresh,
  baseInterval = 60000,
  maxInterval = 300000,
  backoffMultiplier = 1.5
}: SmartRefreshConfig) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const currentIntervalRef = useRef(baseInterval);
  const failureCountRef = useRef(0);

  const refreshWithBackoff = useCallback(async () => {
    if (!enabled || !channelId) return;

    try {
      console.log(`🔄 [SMART-REFRESH] Refreshing channel ${channelId}`);
      await onRefresh();
      
      // Reset on success
      failureCountRef.current = 0;
      currentIntervalRef.current = baseInterval;
    } catch (error) {
      console.error(`❌ [SMART-REFRESH] Failed to refresh ${channelId}:`, error);
      
      // Exponential backoff
      failureCountRef.current++;
      currentIntervalRef.current = Math.min(
        baseInterval * Math.pow(backoffMultiplier, failureCountRef.current),
        maxInterval
      );
      
      console.log(`⏰ [SMART-REFRESH] Next refresh in ${currentIntervalRef.current}ms`);
    }
  }, [enabled, channelId, onRefresh, baseInterval, maxInterval, backoffMultiplier]);

  useEffect(() => {
    if (!enabled || !channelId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    const scheduleNext = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setTimeout(async () => {
        await refreshWithBackoff();
        scheduleNext();
      }, currentIntervalRef.current);
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, channelId, refreshWithBackoff]);
};

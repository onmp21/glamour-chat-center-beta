
import { useEffect, useState, useRef, useCallback } from 'react';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef<((payload: any) => void) | null>(null);
  const tableNameRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const subscriptionPromiseRef = useRef<Promise<any> | null>(null);

  // Stable callback that won't change on every render
  const stableCallback = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('🔴 [CONVERSATION_REALTIME] New realtime message:', payload);
    if (payload.new && onNewMessage) {
      onNewMessage(payload.new as RawMessage);
    }
  }, [onNewMessage]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!channelId || !onNewMessage) {
      setIsConnected(false);
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[CONVERSATION_REALTIME] No table mapping found for channel: ${channelId}`);
      setIsConnected(false);
      return;
    }

    // Store refs for cleanup
    tableNameRef.current = tableName;
    callbackRef.current = stableCallback;

    const setupSubscription = async () => {
      if (!mountedRef.current) return;
      
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        
        // Store the promise to prevent duplicate calls
        subscriptionPromiseRef.current = subscriptionManager.createSubscription(tableName, stableCallback);
        await subscriptionPromiseRef.current;

        if (mountedRef.current) {
          setIsConnected(true);
          console.log(`✅ [CONVERSATION_REALTIME] Connected to ${tableName}`);
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
        if (mountedRef.current) {
          setIsConnected(false);
        }
      } finally {
        subscriptionPromiseRef.current = null;
      }
    };

    // Only setup if we're not already setting up
    if (!subscriptionPromiseRef.current) {
      setupSubscription();
    }

    return () => {
      mountedRef.current = false;
      
      if (tableNameRef.current && callbackRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription for table ${tableNameRef.current}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(tableNameRef.current, callbackRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_REALTIME] Error cleaning up subscription:', error);
        }
      }
      setIsConnected(false);
    };
  }, [channelId, stableCallback]);

  return { isConnected };
};


import { useEffect, useState, useRef, useCallback } from 'react';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const subscriberIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

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

    const setupSubscription = async () => {
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        const subscriberId = await subscriptionManager.subscribe(tableName, stableCallback);
        
        if (mountedRef.current) {
          subscriberIdRef.current = subscriberId;
          setIsConnected(true);
          console.log(`✅ [CONVERSATION_REALTIME] Connected to ${tableName} with ID ${subscriberId}`);
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
        if (mountedRef.current) {
          setIsConnected(false);
        }
      }
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      
      if (subscriberIdRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription ${subscriberIdRef.current}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.unsubscribe(tableName, subscriberIdRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_REALTIME] Error cleaning up subscription:', error);
        }
      }
      setIsConnected(false);
    };
  }, [channelId, stableCallback]);

  return { isConnected };
};

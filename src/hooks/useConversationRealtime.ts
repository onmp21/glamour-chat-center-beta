
import { useEffect, useState, useRef, useCallback } from 'react';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Callback estável que não muda a cada render
  const stableCallback = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('🔴 [CONVERSATION_REALTIME] New realtime message:', payload);
    if (payload.new && onNewMessage) {
      onNewMessage(payload.new as RawMessage);
    }
  }, [onNewMessage]);

  useEffect(() => {
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

    let mounted = true;

    const setupSubscription = async () => {
      if (!mounted) return;
      
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        const callbackId = await subscriptionManager.createSubscription(tableName, stableCallback);
        
        if (mounted) {
          callbackIdRef.current = callbackId;
          setIsConnected(true);
          console.log(`✅ [CONVERSATION_REALTIME] Connected to ${tableName} with callback ${callbackId}`);
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      mountedRef.current = false;
      
      if (callbackIdRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription callback ${callbackIdRef.current}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(tableName, callbackIdRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_REALTIME] Error cleaning up subscription:', error);
        }
      }
      setIsConnected(false);
    };
  }, [channelId, stableCallback]);

  return { isConnected };
};

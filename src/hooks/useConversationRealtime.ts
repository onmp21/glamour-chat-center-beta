
import { useEffect, useState, useRef } from 'react';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef<((payload: any) => void) | null>(null);
  const tableNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!channelId || !onNewMessage) return;

    const tableName = getTableNameForChannelSync(channelId);
    tableNameRef.current = tableName;

    const callback = (payload: any) => {
      console.log('🔴 [CONVERSATION_REALTIME] New realtime message:', payload);
      if (payload.new && onNewMessage) {
        onNewMessage(payload.new as RawMessage);
      }
    };

    callbackRef.current = callback;

    const setupSubscription = async () => {
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        
        const channel = await subscriptionManager.createSubscription(tableName, callback);

        if (channel) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (tableNameRef.current && callbackRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription for table ${tableNameRef.current}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(tableNameRef.current, callbackRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_REALTIME] Error cleaning up subscription:', error);
        }
        setIsConnected(false);
      }
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};

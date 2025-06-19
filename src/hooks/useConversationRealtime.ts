
import { useEffect, useState, useRef } from 'react';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef<((payload: any) => void) | null>(null);
  const tableNameRef = useRef<string | null>(null);
  const subscriptionManagerRef = useRef<RealtimeSubscriptionManager | null>(null);

  useEffect(() => {
    if (!channelId || !onNewMessage) {
      setIsConnected(false);
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    tableNameRef.current = tableName;
    subscriptionManagerRef.current = RealtimeSubscriptionManager.getInstance();

    const callback = (payload: any) => {
      console.log('🔴 [CONVERSATION_REALTIME] New realtime message:', payload);
      if (payload.new && onNewMessage) {
        onNewMessage(payload.new as RawMessage);
      }
    };

    callbackRef.current = callback;

    const setupSubscription = async () => {
      try {
        if (!subscriptionManagerRef.current) return;
        
        const channel = await subscriptionManagerRef.current.createSubscription(tableName, callback);

        if (channel) {
          setIsConnected(true);
          console.log(`✅ [CONVERSATION_REALTIME] Connected to ${tableName}`);
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (tableNameRef.current && callbackRef.current && subscriptionManagerRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription for table ${tableNameRef.current}`);
        try {
          subscriptionManagerRef.current.removeSubscription(tableNameRef.current, callbackRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_REALTIME] Error cleaning up subscription:', error);
        }
        setIsConnected(false);
      }
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};


import { useEffect, useState, useRef } from 'react';
import { MessageService } from '@/services/MessageService';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionNameRef = useRef<string | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!channelId) return;

    // Prevent multiple subscriptions for the same channel
    if (isSubscribedRef.current) {
      console.log(`🔌 [CONVERSATION_REALTIME] Already subscribed to ${channelId}, skipping`);
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    const subscriptionName = `realtime-${channelId}-${Date.now()}`;
    subscriptionNameRef.current = subscriptionName;

    try {
      const subscriptionManager = RealtimeSubscriptionManager.getInstance();
      
      const channel = subscriptionManager.createSubscription(
        subscriptionName,
        (payload) => {
          console.log('🔴 [CONVERSATION_REALTIME] New realtime message:', payload);
          if (payload.new && onNewMessage) {
            onNewMessage(payload.new as RawMessage);
          }
        },
        tableName
      );

      if (channel) {
        // Subscribe only once
        channel.subscribe((status: string) => {
          console.log(`🔌 [CONVERSATION_REALTIME] Status: ${status} for ${channelId}`);
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
          }
        });
      }
    } catch (error) {
      console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
    }

    return () => {
      if (subscriptionNameRef.current && isSubscribedRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription for ${channelId}`);
        try {
          const subscriptionManager = RealtimeSubscriptionManager.getInstance();
          subscriptionManager.removeSubscription(subscriptionNameRef.current);
        } catch (error) {
          console.error('❌ [CONVERSATION_REALTIME] Error cleaning up subscription:', error);
        }
        setIsConnected(false);
        isSubscribedRef.current = false;
        subscriptionNameRef.current = null;
      }
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};

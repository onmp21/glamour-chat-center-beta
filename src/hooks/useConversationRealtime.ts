
import { useEffect, useState, useRef } from 'react';
import { MessageService } from '@/services/MessageService';
import { RawMessage } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import RealtimeSubscriptionManager from '@/services/RealtimeSubscriptionManager';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionNameRef = useRef<string | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!channelId || isSubscribedRef.current || isInitializingRef.current) return;

    isInitializingRef.current = true;
    const tableName = getTableNameForChannelSync(channelId);
    const subscriptionName = `realtime-${channelId}-${Date.now()}`;
    subscriptionNameRef.current = subscriptionName;

    const setupSubscription = async () => {
      try {
        const subscriptionManager = RealtimeSubscriptionManager.getInstance();
        
        const channel = await subscriptionManager.createSubscription(
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
          setIsConnected(true);
          isSubscribedRef.current = true;
        }
      } catch (error) {
        console.error('❌ [CONVERSATION_REALTIME] Error setting up subscription:', error);
        setIsConnected(false);
      } finally {
        isInitializingRef.current = false;
      }
    };

    setupSubscription();

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
      isInitializingRef.current = false;
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};

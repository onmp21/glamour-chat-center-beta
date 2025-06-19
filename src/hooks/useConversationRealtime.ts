
import { useEffect, useState, useRef } from 'react';
import { MessageService } from '@/services/MessageService';
import { RawMessage } from '@/types/messages';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!channelId) return;

    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      console.log(`🔌 [CONVERSATION_REALTIME] Already subscribed to ${channelId}, skipping`);
      return;
    }

    const messageService = new MessageService(channelId);
    const channelSuffix = `-realtime-${channelId}-${Date.now()}`;

    try {
      const channel = messageService.createRealtimeSubscription((payload) => {
        console.log('New realtime message:', payload);
        if (payload.new && onNewMessage) {
          onNewMessage(payload.new as RawMessage);
        }
      }, channelSuffix);

      channelRef.current = channel;

      // Subscribe only once
      channel.subscribe((status: string) => {
        console.log(`🔌 [CONVERSATION_REALTIME] Status: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channelRef.current && isSubscribedRef.current) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription for ${channelId}`);
        try {
          const repository = messageService['getRepository']();
          const tableName = repository.getTableName();
          MessageService.unsubscribeChannel(channelSuffix, tableName);
        } catch (error) {
          console.error('Error cleaning up realtime subscription:', error);
        }
        setIsConnected(false);
        isSubscribedRef.current = false;
        channelRef.current = null;
      }
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};

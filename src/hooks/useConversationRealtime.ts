
import { useEffect, useState } from 'react';
import { MessageService } from '@/services/MessageService';
import { RawMessage } from '@/types/messages';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!channelId) return;

    const messageService = new MessageService(channelId);
    let channel: any = null;
    const channelSuffix = `-realtime-${Date.now()}`;

    try {
      channel = messageService.createRealtimeSubscription((payload) => {
        console.log('New realtime message:', payload);
        if (payload.new && onNewMessage) {
          onNewMessage(payload.new as RawMessage);
        }
      }, channelSuffix);

      // Subscribe only once
      channel.subscribe((status: string) => {
        console.log(`🔌 [CONVERSATION_REALTIME] Status: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
      });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channel) {
        console.log(`🔌 [CONVERSATION_REALTIME] Cleaning up subscription for ${channelId}`);
        try {
          const repository = messageService['getRepository']();
          const tableName = repository.getTableName();
          MessageService.unsubscribeChannel(channelSuffix, tableName);
        } catch (error) {
          console.error('Error cleaning up realtime subscription:', error);
        }
        setIsConnected(false);
      }
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};

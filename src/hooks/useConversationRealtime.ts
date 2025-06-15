

import { useEffect, useState } from 'react';
import { MessageService } from '@/services/MessageService';
import { RawMessage } from '@/types/messages';

export const useConversationRealtime = (channelId: string, onNewMessage?: (message: RawMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!channelId) return;

    const messageService = new MessageService(channelId);
    let channel: any = null;

    try {
      // Apenas crie a subscription, NÃO chame subscribe() aqui novamente!
      channel = messageService.createRealtimeSubscription((payload) => {
        console.log('New realtime message:', payload);
        if (payload.new && onNewMessage) {
          onNewMessage(payload.new as RawMessage);
        }
      });

      // NÃO chame channel.subscribe() aqui - já está inscrito!
      // channel.subscribe((status: string) => {
      //   setIsConnected(status === 'SUBSCRIBED');
      // });
      setIsConnected(true);
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channel) {
        const repository = messageService['getRepository']();
        const tableName = repository.getTableName();
        MessageService.unsubscribeChannel('', tableName);
        setIsConnected(false);
      }
    };
  }, [channelId, onNewMessage]);

  return { isConnected };
};


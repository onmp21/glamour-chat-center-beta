
import { useEffect, useRef } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { parseMessageData } from '@/utils/messageParser';

interface UseConversationRealtimeProps {
  channelId?: string;
  onNewMessage: () => Promise<void>;
}

export const useConversationRealtime = ({ channelId, onNewMessage }: UseConversationRealtimeProps) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!channelId) return;

    console.log(`🚀 [REALTIME] Setting up subscription for channel: ${channelId}`);

    // Clean up previous subscription if it exists
    if (channelRef.current) {
      console.log(`🔴 [REALTIME] Cleaning up previous subscription for ${channelId}`);
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const channelService = new ChannelService(channelId);
    channelRef.current = channelService
      .createRealtimeChannel(`-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: channelService.getTableName(),
        },
        async (payload) => {
          console.log(`🔴 [REALTIME] New conversation via realtime for ${channelId}:`, payload);
          
          // Verify if the new message is valid before reloading
          const parsedMessage = parseMessageData(payload.new.message);
          if (parsedMessage && parsedMessage.content.trim().length > 0) {
            console.log('✅ [REALTIME] Valid new message, reloading conversations');
            await onNewMessage();
          } else {
            console.log('⏭️ [REALTIME] Invalid message ignored, not reloading');
          }
        }
      );

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        console.log(`🔴 [REALTIME] Unsubscribing from channel: ${channelId}`);
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [channelId, onNewMessage]);
};

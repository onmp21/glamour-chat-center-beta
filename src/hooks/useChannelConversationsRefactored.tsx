
import { useState, useEffect, useCallback } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { ChannelConversation } from '@/types/messages';
import { ConversationGrouper } from '@/utils/ConversationGrouper';

export const useChannelConversationsRefactored = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (!channelId) {
      console.log('❌ [CONVERSATIONS_HOOK] No channelId provided');
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        console.log(`🔄 [CONVERSATIONS_HOOK] Manual refresh for channel: ${channelId}`);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log(`🔄 [CONVERSATIONS_HOOK] Loading conversations for channel: ${channelId}`);

      const channelService = new ChannelService(channelId);
      const rawMessages = await channelService.fetchMessages();

      console.log(`📨 [CONVERSATIONS_HOOK] Fetched ${rawMessages.length} raw messages`);

      const groupedConversations = ConversationGrouper.groupMessagesByPhone(rawMessages, channelId);
      console.log(`📱 [CONVERSATIONS_HOOK] Grouped into ${groupedConversations.length} conversations`);

      setConversations(groupedConversations);
    } catch (err) {
      console.error(`❌ [CONVERSATIONS_HOOK] Error loading conversations for channel ${channelId}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [channelId]);

  const refreshConversations = useCallback(() => {
    console.log(`🔄 [CONVERSATIONS_HOOK] Manual refresh triggered for channel: ${channelId}`);
    loadConversations(true);
  }, [channelId, loadConversations]);

  useEffect(() => {
    loadConversations();

    // Setup realtime subscription with proper cleanup
    let channel: any = null;
    
    if (channelId) {
      const channelService = new ChannelService(channelId);
      channel = channelService
        .createRealtimeChannel(`-conversations-${Date.now()}`) // Add timestamp to ensure unique channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: channelService.getTableName(),
          },
          (payload) => {
            console.log(`🔴 [CONVERSATIONS_HOOK] New message via realtime for ${channelId}:`, payload);
            console.log(`📝 [CONVERSATIONS_HOOK] Message received but not auto-reloading conversations to prevent overlay refresh`);
          }
        );
      
      // Subscribe to the channel
      channel.subscribe();
    }

    return () => {
      if (channel) {
        console.log(`🔌 [CONVERSATIONS_HOOK] Unsubscribing from channel ${channelId}`);
        channel.unsubscribe();
      }
    };
  }, [channelId, loadConversations]);

  return {
    conversations,
    loading,
    refreshing,
    error,
    refreshConversations
  };
};

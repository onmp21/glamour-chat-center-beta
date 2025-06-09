
import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';
import { MessageConverter } from '@/utils/MessageConverter';
import { MessageSorter } from '@/utils/MessageSorter';

export const useChannelMessagesRefactored = (channelId: string, conversationId?: string) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📨 [MESSAGES_HOOK_V2] Loading messages for channel: ${channelId}, conversation: ${conversationId}`);

      const messageService = new MessageService(channelId);
      
      let loadedMessages: ChannelMessage[];
      if (conversationId) {
        loadedMessages = await messageService.getMessagesByConversation(conversationId);
      } else {
        loadedMessages = await messageService.getAllMessages();
      }

      const sortedMessages = MessageSorter.sortChannelMessages(loadedMessages);
      
      console.log(`✅ [MESSAGES_HOOK_V2] Loaded ${sortedMessages.length} messages`);
      setMessages(sortedMessages);
    } catch (err) {
      console.error(`❌ [MESSAGES_HOOK_V2] Error loading messages:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  const addMessage = useCallback((newMessage: RawMessage) => {
    setMessages(prevMessages => {
      const processedMessage = MessageConverter.rawToChannelMessage(newMessage);
      
      if (MessageConverter.isDuplicate(prevMessages, processedMessage)) {
        console.log(`⚠️ [MESSAGES_HOOK_V2] Message with ID ${processedMessage.id} already exists, skipping add.`);
        return prevMessages;
      }

      console.log(`➕ [MESSAGES_HOOK_V2] Adding new message to state:`, processedMessage);
      return MessageSorter.sortChannelMessages([...prevMessages, processedMessage]);
    });
  }, []);

  useEffect(() => {
    loadMessages();

    // Setup realtime subscription with proper cleanup
    let channel: any = null;

    if (channelId) {
      const messageService = new MessageService(channelId);
      const channelSuffix = conversationId ? `-${conversationId}-${Date.now()}` : `-messages-${Date.now()}`;
      
      channel = messageService.createRealtimeSubscription((payload) => {
        console.log(`🔴 [MESSAGES_HOOK_V2] New message via realtime:`, payload);
        
        if (conversationId) {
          const messagePhone = messageService.extractPhoneFromSessionId(payload.new.session_id);
          if (messagePhone !== conversationId) {
            console.log(`⏭️ [MESSAGES_HOOK_V2] Message not for current conversation, ignoring`);
            return;
          }
        }
        
        addMessage(payload.new as RawMessage);
      }, channelSuffix);

      channel.subscribe();
    }

    return () => {
      if (channel) {
        console.log(`🔌 [MESSAGES_HOOK_V2] Unsubscribing from channel ${channelId}`);
        channel.unsubscribe();
      }
    };
  }, [channelId, conversationId, loadMessages, addMessage]);

  return {
    messages,
    loading,
    error,
    refreshMessages: loadMessages,
    addMessage
  };
};

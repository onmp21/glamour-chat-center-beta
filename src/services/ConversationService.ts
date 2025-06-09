
import { supabase } from '@/integrations/supabase/client';
import { ChannelService } from './ChannelService';
import { ConversationGrouper } from '@/utils/ConversationGrouper';
import { ChannelConversation } from '@/types/messages';
import { parseMessageData } from '@/utils/messageParser';

export class ConversationService {
  private channelService: ChannelService;

  constructor(private channelId: string) {
    this.channelService = new ChannelService(channelId);
  }

  async loadConversations(): Promise<ChannelConversation[]> {
    console.log(`🔍 [CONVERSATION_SERVICE] Loading conversations for channel: ${this.channelId}`);
    
    const rawMessages = await this.channelService.fetchMessages();
    
    console.log(`🔍 [CONVERSATION_SERVICE] Raw messages from DB: ${rawMessages.length}`);
    
    // Filter valid messages using the parser
    const validMessages = rawMessages.filter(message => {
      if (!message.message) {
        console.log(`❌ [CONVERSATION_SERVICE] Message ${message.id} - No message field`);
        return false;
      }
      
      const parsedMessage = parseMessageData(message.message);
      if (!parsedMessage) {
        console.log(`❌ [CONVERSATION_SERVICE] Message ${message.id} - Parser returned null`);
        return false;
      }
      
      const hasValidContent = parsedMessage.content && parsedMessage.content.trim().length > 0;
      if (!hasValidContent) {
        console.log(`❌ [CONVERSATION_SERVICE] Message ${message.id} - No valid content`);
        return false;
      }
      
      console.log(`✅ [CONVERSATION_SERVICE] Message ${message.id} - Valid! Content: "${parsedMessage.content.slice(0, 50)}..."`);
      return true;
    });
    
    console.log(`📊 [CONVERSATION_SERVICE] Filtered ${validMessages.length} valid messages from ${rawMessages.length} total`);
    
    if (validMessages.length === 0) {
      console.log(`⚠️ [CONVERSATION_SERVICE] NO VALID MESSAGES FOUND for channel ${this.channelId}`);
      return [];
    }
    
    // Pass channelId to groupMessagesByPhone for better processing
    const groupedConversations = ConversationGrouper.groupMessagesByPhone(validMessages, this.channelId);
    console.log(`📊 [CONVERSATION_SERVICE] Grouped into ${groupedConversations.length} conversations`);
    
    // Add unread count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      groupedConversations.map(async (conversation) => {
        try {
          const { data: unreadCount } = await supabase
            .rpc('count_unread_messages', {
              table_name: this.channelService.getTableName(),
              p_session_id: conversation.contact_phone
            });

          return {
            ...conversation,
            unread_count: unreadCount || 0
          };
        } catch (error) {
          console.error('❌ [CONVERSATION_SERVICE] Error counting unread messages:', error);
          return {
            ...conversation,
            unread_count: 0
          };
        }
      })
    );
    
    console.log(`✅ [CONVERSATION_SERVICE] Final result: ${conversationsWithUnreadCount.length} conversations with unread counts`);
    return conversationsWithUnreadCount;
  }

  async updateConversationStatus(
    conversationId: string, 
    status: 'unread' | 'in_progress' | 'resolved'
  ): Promise<void> {
    console.log(`🔄 [CONVERSATION_SERVICE] Updating conversation ${conversationId} status to ${status}`);
    
    // Mark messages as read if the status is 'in_progress' or 'resolved'
    if (status === 'in_progress' || status === 'resolved') {
      await supabase.rpc('mark_messages_as_read', {
        table_name: this.channelService.getTableName(),
        p_session_id: conversationId
      });
    }
    
    console.log('✅ [CONVERSATION_SERVICE] Conversation status updated');
  }
}

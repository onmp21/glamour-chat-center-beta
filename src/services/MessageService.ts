
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation, ChannelMessage } from '@/types/messages';
import { MessageTypeMapper } from '@/utils/MessageTypeMapper';
import { getTableNameForChannel } from '@/utils/channelMapping';
import { MessageConverter } from '@/utils/MessageConverter';
import { ConversationGrouper } from '@/utils/ConversationGrouper';
import { PhoneExtractor } from '@/utils/PhoneExtractor';

export class MessageService {
  private repository: MessageRepository;
  private channelId: string;

  constructor(channelId: string) {
    this.channelId = channelId;
    const tableName = getTableNameForChannel(channelId);
    this.repository = new MessageRepository(tableName);
  }

  async getAllMessages(): Promise<ChannelMessage[]> {
    console.log(`🔍 [MESSAGE_SERVICE] Loading all messages for channel: ${this.channelId}`);
    
    try {
      const rawMessages = await this.repository.findAll();
      console.log(`📊 [MESSAGE_SERVICE] Raw messages loaded: ${rawMessages.length}`);
      
      // Map to ChannelMessage format with support for media_base64
      const channelMessages = rawMessages.map(rawMessage => {
        const channelMessage = MessageConverter.rawToChannelMessage(rawMessage);

        // Log detalhado para debug de mídia
        if (rawMessage.mensagemtype && rawMessage.mensagemtype !== 'text') {
          console.log(`🎯 [MESSAGE_SERVICE] MEDIA MESSAGE MAPPED:`, {
            id: rawMessage.id,
            mensagemtype: rawMessage.mensagemtype,
            hasMediaBase64: !!rawMessage.media_base64,
            mediaContentLength: rawMessage.media_base64?.length || 0,
            messageContentLength: rawMessage.message.length,
            finalContentLength: channelMessage.content.length,
            sender: channelMessage.sender,
            tipo_remetente: rawMessage.tipo_remetente
          });
        }

        return channelMessage;
      });

      console.log(`✅ [MESSAGE_SERVICE] Final messages returned: ${channelMessages.length}`);
      return channelMessages;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error loading messages for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getMessagesByConversation(conversationId: string): Promise<ChannelMessage[]> {
    console.log(`🔍 [MESSAGE_SERVICE] Loading messages for conversation: ${conversationId}`);
    
    try {
      const rawMessages = await this.repository.findAll();
      console.log(`📊 [MESSAGE_SERVICE] Raw messages for conversation: ${rawMessages.length}`);
      
      const filteredMessages = rawMessages.filter(msg => {
        const phone = this.extractPhoneFromSessionId(msg.session_id);
        return phone === conversationId;
      });
      
      console.log(`🔄 [MESSAGE_SERVICE] Filtered messages for ${conversationId}: ${filteredMessages.length}`);
      
      // Map to ChannelMessage format preservando mensagemtype e usando media_base64
      const channelMessages = filteredMessages.map(rawMessage => {
        const channelMessage = MessageConverter.rawToChannelMessage(rawMessage);

        // Debug para conversação específica
        if (rawMessage.mensagemtype && rawMessage.mensagemtype !== 'text') {
          console.log(`🎯 [MESSAGE_SERVICE] CONVERSATION MEDIA MESSAGE:`, {
            conversationId,
            messageId: rawMessage.id,
            mensagemtype: rawMessage.mensagemtype,
            hasMediaBase64: !!rawMessage.media_base64,
            mediaContentLength: rawMessage.media_base64?.length || 0,
            messageContentLength: rawMessage.message.length,
            finalChannelMessage: {
              id: channelMessage.id,
              mensagemtype: channelMessage.mensagemtype,
              sender: channelMessage.sender,
              contentLength: channelMessage.content.length
            }
          });
        }

        return channelMessage;
      });

      console.log(`✅ [MESSAGE_SERVICE] Conversation messages returned: ${channelMessages.length}`);
      return channelMessages;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error loading messages for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  async getConversations(): Promise<ChannelConversation[]> {
    console.log(`🔍 [MESSAGE_SERVICE] Loading conversations for channel: ${this.channelId}`);
    
    try {
      const rawMessages = await this.repository.findAll();
      return ConversationGrouper.groupMessagesByPhone(rawMessages, this.channelId);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error loading conversations for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async sendMessage(sessionId: string, content: string, agentName?: string): Promise<RawMessage> {
    console.log(`💾 [MESSAGE_SERVICE] Sending message for channel: ${this.channelId}`);
    
    try {
      return await this.repository.insertMessage(sessionId, content, agentName);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error sending message for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    console.log(`✅ [MESSAGE_SERVICE] Marking conversation as read: ${conversationId}`);
    
    try {
      await this.repository.markAsRead(conversationId);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error marking conversation as read ${conversationId}:`, error);
      throw error;
    }
  }

  createRealtimeSubscription(callback: (payload: any) => void, conversationId?: string) {
    const suffix = conversationId ? `-${conversationId}` : '';
    const channel = this.repository
      .createRealtimeChannel(suffix)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: this.repository.tableNamePublic,
        },
        callback
      );

    return channel;
  }

  public extractPhoneFromSessionId(sessionId: string): string {
    return PhoneExtractor.extractPhoneFromSessionId(sessionId);
  }
}

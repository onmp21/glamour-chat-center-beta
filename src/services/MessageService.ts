
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage } from '@/types/messages';
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';

export class MessageService {
  private repositories: Map<string, MessageRepository> = new Map();

  private getRepository(channelId: string): MessageRepository {
    if (!this.repositories.has(channelId)) {
      const tableName = getTableNameForChannel(channelId);
      this.repositories.set(channelId, new MessageRepository(tableName));
    }
    return this.repositories.get(channelId)!;
  }

  async getMessagesForChannel(channelId: string, limit?: number): Promise<RawMessage[]> {
    const repository = this.getRepository(channelId);
    console.log(`📋 [MESSAGE_SERVICE] Getting messages for channel ${channelId} from table ${repository.getTableName()}`);
    
    try {
      return await repository.findAll(limit);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages for channel ${channelId}:`, error);
      throw error;
    }
  }

  async saveMessage(channelId: string, messageData: Partial<RawMessage>): Promise<RawMessage> {
    const repository = this.getRepository(channelId);
    console.log(`💾 [MESSAGE_SERVICE] Saving message to channel ${channelId}`);
    
    try {
      return await repository.create(messageData);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error saving message to channel ${channelId}:`, error);
      throw error;
    }
  }

  async getMessagesByPhoneNumber(channelId: string, phoneNumber: string): Promise<RawMessage[]> {
    const repository = this.getRepository(channelId);
    console.log(`🔍 [MESSAGE_SERVICE] Getting messages by phone ${phoneNumber} for channel ${channelId}`);
    
    try {
      return await repository.findByPhoneNumber(phoneNumber);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by phone for channel ${channelId}:`, error);
      throw error;
    }
  }

  async getNewMessages(channelId: string, afterTimestamp: string): Promise<RawMessage[]> {
    const repository = this.getRepository(channelId);
    console.log(`🆕 [MESSAGE_SERVICE] Getting new messages after ${afterTimestamp} for channel ${channelId}`);
    
    try {
      const { data, error } = await repository.findMessagesAfterTimestamp(afterTimestamp);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting new messages for channel ${channelId}:`, error);
      throw error;
    }
  }

  async markConversationAsRead(channelId: string, sessionId: string): Promise<void> {
    const repository = this.getRepository(channelId);
    console.log(`✅ [MESSAGE_SERVICE] Marking conversation as read: ${sessionId} in channel ${channelId}`);
    
    try {
      await repository.markAsRead(sessionId);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error marking conversation as read:`, error);
      throw error;
    }
  }

  // Get statistics for a channel
  async getChannelStats(channelId: string): Promise<{
    totalMessages: number;
    totalConversations: number;
    unreadMessages: number;
  }> {
    const repository = this.getRepository(channelId);
    console.log(`📊 [MESSAGE_SERVICE] Getting stats for channel ${channelId} from table ${repository.getTableName()}`);
    
    try {
      const messages = await repository.findAll();
      const conversations = new Set(messages.map(m => m.session_id));
      const unread = messages.filter(m => !m.is_read);
      
      return {
        totalMessages: messages.length,
        totalConversations: conversations.size,
        unreadMessages: unread.length
      };
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting channel stats:`, error);
      throw error;
    }
  }
}

export const messageService = new MessageService();

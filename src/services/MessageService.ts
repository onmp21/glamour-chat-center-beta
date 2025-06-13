
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';

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

  // Legacy methods for backward compatibility
  async getConversations(channelId: string): Promise<ChannelConversation[]> {
    const repository = this.getRepository(channelId);
    const tableName = repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('read_at', { ascending: false });

      if (error) throw error;

      // Group messages by session_id to create conversations
      const conversationsMap = new Map<string, ChannelConversation>();
      
      (data || []).forEach((message: any) => {
        const sessionId = message.session_id;
        if (!conversationsMap.has(sessionId)) {
          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: message.nome_do_contato || message.Nome_do_contato || 'Unknown',
            contact_phone: this.extractPhoneFromSessionId(sessionId),
            last_message: message.message,
            last_message_time: message.read_at || new Date().toISOString(),
            status: message.is_read ? 'resolved' : 'unread',
            updated_at: message.read_at || new Date().toISOString(),
            unread_count: message.is_read ? 0 : 1
          });
        }
      });

      return Array.from(conversationsMap.values());
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting conversations:`, error);
      throw error;
    }
  }

  async getMessagesByConversation(channelId: string, sessionId: string): Promise<RawMessage[]> {
    const repository = this.getRepository(channelId);
    const tableName = repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => repository.mapDatabaseRowToRawMessage(row));
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by conversation:`, error);
      throw error;
    }
  }

  async getAllMessages(channelId: string): Promise<RawMessage[]> {
    return this.getMessagesForChannel(channelId);
  }

  extractPhoneFromSessionId(sessionId: string): string {
    // Extract phone number from session_id format like "5511999999999@s.whatsapp.net"
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }

  async createRealtimeSubscription(channelId: string, callback: (payload: any) => void) {
    const repository = this.getRepository(channelId);
    const tableName = repository.getTableName();
    
    return supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe();
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

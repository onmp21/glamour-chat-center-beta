
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';

export class MessageService {
  private repositories: Map<string, MessageRepository> = new Map();
  private channelId: string;

  constructor(channelId?: string) {
    this.channelId = channelId || '';
  }

  private getRepository(channelId?: string): MessageRepository {
    const targetChannelId = channelId || this.channelId;
    if (!this.repositories.has(targetChannelId)) {
      const tableName = getTableNameForChannel(targetChannelId);
      this.repositories.set(targetChannelId, new MessageRepository(tableName));
    }
    return this.repositories.get(targetChannelId)!;
  }

  async getMessagesForChannel(limit?: number): Promise<RawMessage[]> {
    const repository = this.getRepository();
    console.log(`📋 [MESSAGE_SERVICE] Getting messages for channel ${this.channelId} from table ${repository.getTableName()}`);
    
    try {
      return await repository.findAll(limit);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    const repository = this.getRepository();
    console.log(`💾 [MESSAGE_SERVICE] Saving message to channel ${this.channelId}`);
    
    try {
      return await repository.create(messageData);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error saving message to channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getMessagesByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    const repository = this.getRepository();
    console.log(`🔍 [MESSAGE_SERVICE] Getting messages by phone ${phoneNumber} for channel ${this.channelId}`);
    
    try {
      return await repository.findByPhoneNumber(phoneNumber);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by phone for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getNewMessages(afterTimestamp: string): Promise<RawMessage[]> {
    const repository = this.getRepository();
    console.log(`🆕 [MESSAGE_SERVICE] Getting new messages after ${afterTimestamp} for channel ${this.channelId}`);
    
    try {
      const { data, error } = await repository.findMessagesAfterTimestamp(afterTimestamp);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting new messages for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async markConversationAsRead(sessionId: string): Promise<void> {
    const repository = this.getRepository();
    console.log(`✅ [MESSAGE_SERVICE] Marking conversation as read: ${sessionId} in channel ${this.channelId}`);
    
    try {
      await repository.markAsRead(sessionId);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error marking conversation as read:`, error);
      throw error;
    }
  }

  async getConversations(): Promise<ChannelConversation[]> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('read_at', { ascending: false });

      if (error) throw error;

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

  async getMessagesByConversation(sessionId: string): Promise<{ data: RawMessage[] }> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true });

      if (error) throw error;

      const mappedData = (data || []).map(row => repository.mapDatabaseRowToRawMessage(row));
      return { data: mappedData };
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by conversation:`, error);
      throw error;
    }
  }

  async getAllMessages(): Promise<RawMessage[]> {
    return this.getMessagesForChannel();
  }

  extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }

  createRealtimeSubscription(callback: (payload: any) => void, channelSuffix: string = '') {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    return supabase
      .channel(`${tableName}-changes${channelSuffix}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName as any },
        callback
      )
      .subscribe();
  }

  async getChannelStats(): Promise<{
    totalMessages: number;
    totalConversations: number;
    unreadMessages: number;
  }> {
    const repository = this.getRepository();
    console.log(`📊 [MESSAGE_SERVICE] Getting stats for channel ${this.channelId} from table ${repository.getTableName()}`);
    
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

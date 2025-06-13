
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';

export class MessageService {
  private repositories: Map<string, MessageRepository> = new Map();
  private channelId: string;
  private static activeSubscriptions: Map<string, any> = new Map();

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

  async getConversations(limit?: number): Promise<ChannelConversation[]> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('read_at', { ascending: false })
        .limit(limit || 50);

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

  async getMessagesByConversation(sessionId: string, limit?: number): Promise<{ data: RawMessage[] }> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true })
        .limit(limit || 100);

      if (error) throw error;

      const mappedData = (data || []).map(row => repository.mapDatabaseRowToRawMessage(row));
      return { data: mappedData };
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by conversation:`, error);
      throw error;
    }
  }

  async getAllMessages(limit?: number): Promise<RawMessage[]> {
    return this.getMessagesForChannel(limit);
  }

  extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }

  createRealtimeSubscription(callback: (payload: any) => void, channelSuffix: string = '') {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    const subscriptionKey = `${tableName}-${channelSuffix}`;
    
    // Check if subscription already exists
    if (MessageService.activeSubscriptions.has(subscriptionKey)) {
      console.log(`🔌 [MESSAGE_SERVICE] Subscription already exists for ${subscriptionKey}, reusing`);
      return MessageService.activeSubscriptions.get(subscriptionKey);
    }
    
    const channel = supabase
      .channel(`${tableName}-changes${channelSuffix}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName as any },
        callback
      );

    // Store the subscription
    MessageService.activeSubscriptions.set(subscriptionKey, channel);
    
    return channel;
  }

  static unsubscribeChannel(channelSuffix: string, tableName: string) {
    const subscriptionKey = `${tableName}-${channelSuffix}`;
    const channel = MessageService.activeSubscriptions.get(subscriptionKey);
    
    if (channel) {
      console.log(`🔌 [MESSAGE_SERVICE] Unsubscribing from ${subscriptionKey}`);
      supabase.removeChannel(channel);
      MessageService.activeSubscriptions.delete(subscriptionKey);
    }
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

  async getNewMessagesAfterTimestamp(timestamp: string): Promise<RawMessage[]> {
    return this.getNewMessages(timestamp);
  }

  async fetchMessages(limit?: number): Promise<RawMessage[]> {
    return this.getMessagesForChannel(limit);
  }
}

export const messageService = new MessageService();

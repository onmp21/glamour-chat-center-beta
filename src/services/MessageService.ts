
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';

export class MessageService {
  private repositories: Map<string, MessageRepository> = new Map();
  private channelId: string;
  private static activeSubscriptions: Map<string, any> = new Map();
  private static queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 30000; // 30 segundos

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

  private getCacheKey(method: string, params: any = {}): string {
    return `${this.channelId}-${method}-${JSON.stringify(params)}`;
  }

  private getFromCache<T>(cacheKey: string): T | null {
    const cached = MessageService.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < MessageService.CACHE_DURATION) {
      console.log(`📊 [MESSAGE_SERVICE] Cache hit for ${cacheKey}`);
      return cached.data;
    }
    return null;
  }

  private setCache(cacheKey: string, data: any): void {
    MessageService.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  async getMessagesForChannel(limit = 50): Promise<RawMessage[]> {
    const cacheKey = this.getCacheKey('getMessages', { limit });
    const cached = this.getFromCache<RawMessage[]>(cacheKey);
    if (cached) return cached;

    const repository = this.getRepository();
    console.log(`📋 [MESSAGE_SERVICE] Getting messages for channel ${this.channelId} from table ${repository.getTableName()}`);
    
    try {
      const messages = await repository.findAll(limit);
      this.setCache(cacheKey, messages);
      return messages;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages for channel ${this.channelId}:`, error);
      return [];
    }
  }

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    const repository = this.getRepository();
    console.log(`💾 [MESSAGE_SERVICE] Saving message to channel ${this.channelId}`);
    
    try {
      const result = await repository.create(messageData);
      // Invalidar cache após salvar
      MessageService.queryCache.clear();
      return result;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error saving message to channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getMessagesByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    const cacheKey = this.getCacheKey('getByPhone', { phoneNumber });
    const cached = this.getFromCache<RawMessage[]>(cacheKey);
    if (cached) return cached;

    const repository = this.getRepository();
    console.log(`🔍 [MESSAGE_SERVICE] Getting messages by phone ${phoneNumber} for channel ${this.channelId}`);
    
    try {
      const messages = await repository.findByPhoneNumber(phoneNumber);
      this.setCache(cacheKey, messages);
      return messages;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by phone for channel ${this.channelId}:`, error);
      return [];
    }
  }

  async getNewMessages(afterTimestamp: string): Promise<RawMessage[]> {
    const repository = this.getRepository();
    console.log(`🆕 [MESSAGE_SERVICE] Getting new messages after ${afterTimestamp} for channel ${this.channelId}`);
    
    try {
      const { data, error } = await repository.findMessagesAfterTimestamp(afterTimestamp);
      
      if (error) {
        console.error(`❌ [MESSAGE_SERVICE] Error getting new messages:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting new messages for channel ${this.channelId}:`, error);
      return [];
    }
  }

  async markConversationAsRead(sessionId: string): Promise<void> {
    const repository = this.getRepository();
    console.log(`✅ [MESSAGE_SERVICE] Marking conversation as read: ${sessionId} in channel ${this.channelId}`);
    
    try {
      await repository.markAsRead(sessionId);
      // Invalidar cache após atualização
      MessageService.queryCache.clear();
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error marking conversation as read:`, error);
    }
  }

  async getConversations(limit = 20): Promise<ChannelConversation[]> {
    const cacheKey = this.getCacheKey('getConversations', { limit });
    const cached = this.getFromCache<ChannelConversation[]>(cacheKey);
    if (cached) return cached;

    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      console.log(`📋 [MESSAGE_SERVICE] Getting conversations from ${tableName} with limit ${limit}`);
      
      // Verificar se a tabela existe
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .maybeSingle();

      if (!tableExists) {
        console.log(`⚠️ [MESSAGE_SERVICE] Table ${tableName} does not exist`);
        return [];
      }

      // Query otimizada sem timeout
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('read_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`❌ [MESSAGE_SERVICE] Database error:`, error);
        return [];
      }

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

      const conversations = Array.from(conversationsMap.values());
      console.log(`✅ [MESSAGE_SERVICE] Loaded ${conversations.length} conversations from ${tableName}`);
      
      this.setCache(cacheKey, conversations);
      return conversations;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting conversations:`, error);
      return [];
    }
  }

  async getMessagesByConversation(sessionId: string, limit = 50): Promise<{ data: RawMessage[] }> {
    const cacheKey = this.getCacheKey('getByConversation', { sessionId, limit });
    const cached = this.getFromCache<{ data: RawMessage[] }>(cacheKey);
    if (cached) return cached;

    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      // Verificar se a tabela existe
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .maybeSingle();

      if (!tableExists) {
        console.log(`⚠️ [MESSAGE_SERVICE] Table ${tableName} does not exist`);
        return { data: [] };
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ [MESSAGE_SERVICE] Error getting messages by conversation:`, error);
        return { data: [] };
      }

      const mappedData = (data || []).map(row => repository.mapDatabaseRowToRawMessage(row));
      const result = { data: mappedData };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting messages by conversation:`, error);
      return { data: [] };
    }
  }

  async getAllMessages(limit = 50): Promise<RawMessage[]> {
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
        (payload) => {
          console.log(`🔔 [MESSAGE_SERVICE] Realtime update for ${tableName}:`, payload);
          // Invalidar cache quando há mudanças
          MessageService.queryCache.clear();
          callback(payload);
        }
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

  static clearCache() {
    MessageService.queryCache.clear();
    console.log(`🧹 [MESSAGE_SERVICE] Cache cleared`);
  }

  async getChannelStats(): Promise<{
    totalMessages: number;
    totalConversations: number;
    unreadMessages: number;
  }> {
    const cacheKey = this.getCacheKey('getStats');
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const repository = this.getRepository();
    console.log(`📊 [MESSAGE_SERVICE] Getting stats for channel ${this.channelId} from table ${repository.getTableName()}`);
    
    try {
      // Stats simplificados para evitar queries pesadas
      const conversations = await this.getConversations(10);
      const stats = {
        totalMessages: 0,
        totalConversations: conversations.length,
        unreadMessages: conversations.filter(c => c.status === 'unread').length
      };
      
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error getting channel stats:`, error);
      return {
        totalMessages: 0,
        totalConversations: 0,
        unreadMessages: 0
      };
    }
  }

  async getNewMessagesAfterTimestamp(timestamp: string): Promise<RawMessage[]> {
    return this.getNewMessages(timestamp);
  }

  async fetchMessages(limit = 50): Promise<RawMessage[]> {
    return this.getMessagesForChannel(limit);
  }
}

export const messageService = new MessageService();

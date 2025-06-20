import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { TableName, getTableNameForChannelSync } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client.ts';

// Types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ChannelStats {
  totalMessages: number;
  totalConversations: number;
  unreadMessages: number;
}

interface MessageQuery {
  data: RawMessage[];
}

// Constants
const CACHE_DURATION = 30000; // 30 seconds
const DEFAULT_MESSAGE_LIMIT = 50;
const DEFAULT_CONVERSATION_LIMIT = 20;
const STATS_CONVERSATION_LIMIT = 1000;

// Cache Manager
class CacheManager {
  private static cache: Map<string, CacheEntry<any>> = new Map();

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📊 [MESSAGE_SERVICE] Cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }

  static set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static clear(): void {
    this.cache.clear();
    console.log(`🧹 [MESSAGE_SERVICE] Cache cleared`);
  }

  static invalidate(): void {
    this.clear();
  }
}

// Subscription Manager
class SubscriptionManager {
  private static activeSubscriptions: Map<string, any> = new Map();

  static create(
    tableName: string,
    callback: (payload: any) => void,
    channelSuffix: string = ''
  ): any {
    const subscriptionKey = `${tableName}-${channelSuffix}`;
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      console.log(`⚠️ [MESSAGE_SERVICE] Subscription already exists for ${subscriptionKey}, skipping creation`);
      return this.activeSubscriptions.get(subscriptionKey);
    }
    
    console.log(`🔌 [MESSAGE_SERVICE] Creating new subscription for ${subscriptionKey}`);
    
    try {
      const channel = supabase
        .channel(`${tableName}-changes${channelSuffix}-${Date.now()}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName as any },
          (payload) => {
            console.log(`🔔 [MESSAGE_SERVICE] Realtime update for ${tableName}:`, payload);
            CacheManager.invalidate();
            callback(payload);
          }
        );

      this.activeSubscriptions.set(subscriptionKey, channel);
      
      channel.subscribe((status) => {
        console.log(`📡 [MESSAGE_SERVICE] Subscription status for ${subscriptionKey}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [MESSAGE_SERVICE] Successfully subscribed to ${subscriptionKey}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [MESSAGE_SERVICE] Subscription error for ${subscriptionKey}`);
          this.activeSubscriptions.delete(subscriptionKey);
        }
      });
      
      return channel;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error creating subscription for ${subscriptionKey}:`, error);
      this.activeSubscriptions.delete(subscriptionKey);
      throw error;
    }
  }

  static unsubscribe(channelSuffix: string, tableName: string): void {
    const subscriptionKey = `${tableName}-${channelSuffix}`;
    const channel = this.activeSubscriptions.get(subscriptionKey);
    
    if (channel) {
      console.log(`🔌 [MESSAGE_SERVICE] Unsubscribing from ${subscriptionKey}`);
      try {
        supabase.removeChannel(channel);
        this.activeSubscriptions.delete(subscriptionKey);
        console.log(`✅ [MESSAGE_SERVICE] Successfully unsubscribed from ${subscriptionKey}`);
      } catch (error) {
        console.error(`❌ [MESSAGE_SERVICE] Error unsubscribing from ${subscriptionKey}:`, error);
        this.activeSubscriptions.delete(subscriptionKey);
      }
    } else {
      console.log(`ℹ️ [MESSAGE_SERVICE] No active subscription found for ${subscriptionKey}`);
    }
  }

  static unsubscribeAll(): void {
    console.log(`🔌 [MESSAGE_SERVICE] Unsubscribing from all active subscriptions`);
    const subscriptionKeys = Array.from(this.activeSubscriptions.keys());
    
    subscriptionKeys.forEach(key => {
      const channel = this.activeSubscriptions.get(key);
      if (channel) {
        try {
          supabase.removeChannel(channel);
          console.log(`✅ [MESSAGE_SERVICE] Unsubscribed from ${key}`);
        } catch (error) {
          console.error(`❌ [MESSAGE_SERVICE] Error unsubscribing from ${key}:`, error);
        }
      }
    });
    
    this.activeSubscriptions.clear();
    console.log(`✅ [MESSAGE_SERVICE] All subscriptions cleared`);
  }
}

// Conversation Processor
class ConversationProcessor {
  static extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }

  static processConversationsFromMessages(messages: any[], limit: number): ChannelConversation[] {
    const conversationsMap = new Map<string, ChannelConversation>();
    
    messages.forEach((message: any) => {
      const sessionId = message.session_id;
      
      if (conversationsMap.has(sessionId)) {
        const existing = conversationsMap.get(sessionId)!;
        if (!message.is_read) {
          existing.unread_count = (existing.unread_count || 0) + 1;
        }
        // Keep the most recent message
        if (message.read_at > existing.last_message_time!) {
          existing.last_message = message.message;
          existing.last_message_time = message.read_at;
        }
      } else {
        // Create new conversation
        conversationsMap.set(sessionId, {
          id: sessionId,
          contact_name: message.nome_do_contato || 'Unknown',
          contact_phone: this.extractPhoneFromSessionId(sessionId),
          last_message: message.message,
          last_message_time: message.read_at || new Date().toISOString(),
          status: message.is_read ? 'resolved' : 'unread',
          updated_at: message.read_at || new Date().toISOString(),
          unread_count: message.is_read ? 0 : 1
        });
      }
    });

    return Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime())
      .slice(0, limit);
  }

  static calculateStats(conversations: ChannelConversation[]): ChannelStats {
    return {
      totalMessages: 0, // Placeholder, as this can be expensive
      totalConversations: conversations.length,
      unreadMessages: conversations.filter(c => c.status === 'unread').length
    };
  }
}

// Repository Manager
class RepositoryManager {
  private repositories: Map<string, MessageRepository> = new Map();

  getRepository(channelId: string): MessageRepository {
    if (!this.repositories.has(channelId)) {
      const tableName = getTableNameForChannelSync(channelId);
      this.repositories.set(channelId, new MessageRepository(tableName));
    }
    return this.repositories.get(channelId)!;
  }
}

// Main Service
export class MessageService {
  private repositoryManager = new RepositoryManager();
  private channelId: string;

  constructor(channelId?: string) {
    this.channelId = channelId || '';
  }

  // Private Methods
  private getRepository(channelId?: string): MessageRepository {
    const targetChannelId = channelId || this.channelId;
    return this.repositoryManager.getRepository(targetChannelId);
  }

  private getCacheKey(method: string, params: any = {}): string {
    return `${this.channelId}-${method}-${JSON.stringify(params)}`;
  }

  private async executeWithCache<T>(
    cacheKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const cached = CacheManager.get<T>(cacheKey);
    if (cached) return cached;

    try {
      const result = await operation();
      CacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Operation failed for ${cacheKey}:`, error);
      throw error;
    }
  }

  // Public Methods - Message Operations
  async getMessagesForChannel(limit = DEFAULT_MESSAGE_LIMIT): Promise<RawMessage[]> {
    const cacheKey = this.getCacheKey('getMessages', { limit });
    
    return this.executeWithCache(cacheKey, async () => {
      const repository = this.getRepository();
      console.log(`📋 [MESSAGE_SERVICE] Getting messages for channel ${this.channelId} from table ${repository.getTableName()}`);
      
      return await repository.findAll(limit);
    });
  }

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    const repository = this.getRepository();
    console.log(`💾 [MESSAGE_SERVICE] Saving message to channel ${this.channelId}`);
    
    try {
      const result = await repository.create(messageData);
      CacheManager.invalidate();
      return result;
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error saving message to channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getMessagesByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    const cacheKey = this.getCacheKey('getByPhone', { phoneNumber });
    
    return this.executeWithCache(cacheKey, async () => {
      const repository = this.getRepository();
      console.log(`🔍 [MESSAGE_SERVICE] Getting messages by phone ${phoneNumber} for channel ${this.channelId}`);
      
      return await repository.findByPhoneNumber(phoneNumber);
    });
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
      CacheManager.invalidate();
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE] Error marking conversation as read:`, error);
    }
  }

  // Conversation Operations
  async getConversations(limit = DEFAULT_CONVERSATION_LIMIT): Promise<ChannelConversation[]> {
    const cacheKey = this.getCacheKey('getConversations', { limit });
    
    return this.executeWithCache(cacheKey, async () => {
      const repository = this.getRepository();
      const tableName = repository.getTableName();
      
      console.log(`📋 [MESSAGE_SERVICE] Getting conversations from ${tableName} with limit ${limit}`);
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          session_id,
          nome_do_contato,
          message,
          read_at,
          is_read
        `)
        .order('read_at', { ascending: false });

      if (error) {
        console.error(`❌ [MESSAGE_SERVICE] Database error:`, error);
        return [];
      }

      const conversations = ConversationProcessor.processConversationsFromMessages(data || [], limit);
      console.log(`✅ [MESSAGE_SERVICE] Loaded ${conversations.length} unique conversations from ${tableName}`);
      
      return conversations;
    });
  }

  async getMessagesByConversation(sessionId: string, limit = DEFAULT_MESSAGE_LIMIT): Promise<MessageQuery> {
    const cacheKey = this.getCacheKey('getByConversation', { sessionId, limit });
    
    return this.executeWithCache(cacheKey, async () => {
      const repository = this.getRepository();
      const tableName = repository.getTableName();
      
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
      return { data: mappedData };
    });
  }

  // Statistics
  async getChannelStats(): Promise<ChannelStats> {
    const cacheKey = this.getCacheKey('getStats');
    
    return this.executeWithCache(cacheKey, async () => {
      console.log(`📊 [MESSAGE_SERVICE] Getting stats for channel ${this.channelId}`);
      
      const conversations = await this.getConversations(STATS_CONVERSATION_LIMIT);
      return ConversationProcessor.calculateStats(conversations);
    });
  }

  // Realtime Subscriptions
  createRealtimeSubscription(callback: (payload: any) => void, channelSuffix: string = '') {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    return SubscriptionManager.create(tableName, callback, channelSuffix);
  }

  // Utility Methods
  extractPhoneFromSessionId(sessionId: string): string {
    return ConversationProcessor.extractPhoneFromSessionId(sessionId);
  }

  // Legacy Method Aliases (for backward compatibility)
  async getAllMessages(limit = DEFAULT_MESSAGE_LIMIT): Promise<RawMessage[]> {
    return this.getMessagesForChannel(limit);
  }

  async getNewMessagesAfterTimestamp(timestamp: string): Promise<RawMessage[]> {
    return this.getNewMessages(timestamp);
  }

  async fetchMessages(limit = DEFAULT_MESSAGE_LIMIT): Promise<RawMessage[]> {
    return this.getMessagesForChannel(limit);
  }

  // Static Methods
  static unsubscribeChannel(channelSuffix: string, tableName: string): void {
    SubscriptionManager.unsubscribe(channelSuffix, tableName);
  }

  static unsubscribeAll(): void {
    SubscriptionManager.unsubscribeAll();
  }

  static clearCache(): void {
    CacheManager.clear();
  }
}

export const messageService = new MessageService();


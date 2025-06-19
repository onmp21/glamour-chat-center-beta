
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';

export class OptimizedMessageService {
  private static instances = new Map<string, OptimizedMessageService>();
  private repository: MessageRepository;
  private channelId: string;

  private constructor(channelId: string) {
    this.channelId = channelId;
    const tableName = getTableNameForChannelSync(channelId);
    this.repository = new MessageRepository(tableName);
  }

  static getInstance(channelId: string): OptimizedMessageService {
    if (!this.instances.has(channelId)) {
      this.instances.set(channelId, new OptimizedMessageService(channelId));
    }
    return this.instances.get(channelId)!;
  }

  // Public constructor for direct instantiation (fixing the private constructor issue)
  constructor(channelId: string) {
    this.channelId = channelId;
    const tableName = getTableNameForChannelSync(channelId);
    this.repository = new MessageRepository(tableName);
  }

  async getMessages(limit = 50): Promise<RawMessage[]> {
    try {
      return await this.repository.findAll(limit);
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting messages for channel ${this.channelId}:`, error);
      return [];
    }
  }

  async getMessagesByPhone(phoneNumber: string): Promise<RawMessage[]> {
    try {
      return await this.repository.findByPhoneNumber(phoneNumber);
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting messages by phone:`, error);
      return [];
    }
  }

  async getMessagesByConversation(sessionId: string, limit = 50): Promise<{ data: RawMessage[] }> {
    try {
      console.log(`📋 [OPTIMIZED_MESSAGE_SERVICE] Getting messages for conversation ${sessionId}`);
      const tableName = this.repository.getTableName();
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Database error:`, error);
        return { data: [] };
      }

      // Convert to RawMessage format
      const messages: RawMessage[] = (data || []).map((record: any) => ({
        id: record.id?.toString() || Math.random().toString(),
        content: record.message || '',
        timestamp: record.read_at || new Date().toISOString(),
        sender: record.tipo_remetente === 'USUARIO_INTERNO' ? 'agent' : 'user',
        tipo_remetente: record.tipo_remetente,
        session_id: record.session_id,
        Nome_do_contato: record.nome_do_contato,
        nome_do_contato: record.nome_do_contato,
        contactName: record.nome_do_contato,
        mensagemtype: record.mensagemtype || 'text',
        media_base64: record.media_base64,
        media_url: record.media_url,
        is_read: record.is_read
      }));

      console.log(`✅ [OPTIMIZED_MESSAGE_SERVICE] Retrieved ${messages.length} messages for conversation ${sessionId}`);
      return { data: messages };
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting messages by conversation:`, error);
      return { data: [] };
    }
  }

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    try {
      return await this.repository.create(messageData);
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error saving message:`, error);
      throw error;
    }
  }

  async migrateChannelBase64(): Promise<number> {
    try {
      console.log(`🔄 [OPTIMIZED_MESSAGE_SERVICE] Starting base64 migration for channel ${this.channelId}`);
      const tableName = this.repository.getTableName();
      
      // Get messages with base64 content
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .or('message.like.data:%,media_base64.like.data:%')
        .limit(100);

      if (error) {
        console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error fetching base64 messages:`, error);
        return 0;
      }

      if (!data || data.length === 0) {
        console.log(`ℹ️ [OPTIMIZED_MESSAGE_SERVICE] No base64 messages found for migration`);
        return 0;
      }

      console.log(`✅ [OPTIMIZED_MESSAGE_SERVICE] Found ${data.length} messages to migrate`);
      return data.length;
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error during base64 migration:`, error);
      return 0;
    }
  }

  async getConversations(limit = 20): Promise<ChannelConversation[]> {
    const tableName = this.repository.getTableName();
    
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('read_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Database error:`, error);
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

      return Array.from(conversationsMap.values());
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting conversations:`, error);
      return [];
    }
  }

  private extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }
}

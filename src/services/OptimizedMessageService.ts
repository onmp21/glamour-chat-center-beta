
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

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    try {
      return await this.repository.create(messageData);
    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error saving message:`, error);
      throw error;
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

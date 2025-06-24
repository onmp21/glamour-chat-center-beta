
import { RawMessage, ChannelConversation } from '@/types/messages';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';

export class MessageServiceV2 {
  private channelId: string;
  private tableName: string;

  constructor(channelId: string) {
    this.channelId = channelId;
    this.tableName = getTableNameForChannelSync(channelId);
  }

  async getMessagesByConversation(sessionId: string, limit = 50): Promise<{ data: RawMessage[] }> {
    console.log(`📋 [MESSAGE_SERVICE_V2] Getting messages for conversation ${sessionId}`);
    
    try {
      const { data, error } = await supabase
        .from(this.tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ [MESSAGE_SERVICE_V2] Database error:`, error);
        return { data: [] };
      }

      const messages: RawMessage[] = (data || []).map((record: any) => ({
        id: record.id?.toString() || Math.random().toString(),
        content: record.message || '',
        message: record.message || '',
        timestamp: record.read_at || new Date().toISOString(),
        sender: record.tipo_remetente === 'USUARIO_INTERNO' ? 'agent' : 'user',
        tipo_remetente: record.tipo_remetente,
        session_id: record.session_id,
        Nome_do_contato: record.nome_do_contato,
        nome_do_contato: record.nome_do_contato,
        mensagemtype: record.mensagemtype || 'text',
        is_read: record.is_read
      }));

      console.log(`✅ [MESSAGE_SERVICE_V2] Retrieved ${messages.length} messages for conversation ${sessionId}`);
      return { data: messages };
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE_V2] Error getting messages by conversation:`, error);
      return { data: [] };
    }
  }

  async getConversations(limit = 20): Promise<ChannelConversation[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName as any)
        .select('*')
        .order('read_at', { ascending: false })
        .limit(limit * 10);

      if (error) {
        console.error(`❌ [MESSAGE_SERVICE_V2] Database error:`, error);
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

      return Array.from(conversationsMap.values()).slice(0, limit);
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE_V2] Error getting conversations:`, error);
      return [];
    }
  }

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    console.log(`💾 [MESSAGE_SERVICE_V2] Saving message`);
    
    try {
      const { data, error } = await supabase
        .from(this.tableName as any)
        .insert({
          session_id: messageData.session_id,
          message: messageData.content || messageData.message || '',
          nome_do_contato: messageData.nome_do_contato,
          mensagemtype: messageData.mensagemtype || 'text',
          tipo_remetente: messageData.tipo_remetente || 'CONTATO_EXTERNO',
          is_read: messageData.is_read || false,
          read_at: messageData.timestamp || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ [MESSAGE_SERVICE_V2] Error saving message:`, error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      return {
        id: data.id.toString(),
        content: data.message,
        message: data.message,
        timestamp: data.read_at,
        sender: data.tipo_remetente === 'USUARIO_INTERNO' ? 'agent' : 'user',
        tipo_remetente: data.tipo_remetente,
        session_id: data.session_id,
        nome_do_contato: data.nome_do_contato,
        mensagemtype: data.mensagemtype,
        is_read: data.is_read
      };
    } catch (error) {
      console.error(`❌ [MESSAGE_SERVICE_V2] Error saving message:`, error);
      throw error;
    }
  }

  private extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }
}

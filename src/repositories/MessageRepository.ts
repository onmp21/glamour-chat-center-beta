
import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from './BaseRepository';
import { RawMessage } from '@/types/messages';
import { TableName } from '@/utils/channelMapping';

export class MessageRepository extends BaseRepository<RawMessage> {
  constructor(tableName: TableName) {
    super(tableName);
  }

  mapDatabaseRowToRawMessage(row: any): RawMessage {
    return {
      id: row.id?.toString() || '',
      session_id: row.session_id || '',
      message: row.message || '',
      sender: this.determineSender(row),
      timestamp: row.read_at || new Date().toISOString(),
      content: row.message || '',
      tipo_remetente: row.tipo_remetente,
      mensagemtype: row.mensagemtype,
      Nome_do_contato: row.Nome_do_contato || row.nome_do_contato,
      nome_do_contato: row.nome_do_contato,
      media_base64: row.media_base64,
      read_at: row.read_at,
      is_read: row.is_read
    };
  }

  private determineSender(row: any): 'customer' | 'agent' {
    if (row.tipo_remetente === 'USUARIO_INTERNO' || row.tipo_remetente === 'Yelena-ai') {
      return 'agent';
    }
    return 'customer';
  }

  async findAll(limit?: number): Promise<RawMessage[]> {
    const query = supabase
      .from(this.tableName as any)
      .select('*')
      .order('id', { ascending: false });

    if (limit) {
      query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error fetching from ${this.tableName}:`, error);
      throw error;
    }

    return (data || []).map(row => this.mapDatabaseRowToRawMessage(row));
  }

  async insertMessage(sessionId: string, message: string, contactName?: string): Promise<RawMessage> {
    const insertData = {
      session_id: sessionId,
      message: message,
      Nome_do_contato: contactName || 'Contato Anônimo',
      read_at: new Date().toISOString(),
      mensagemtype: 'conversation',
      tipo_remetente: 'sistema'
    };

    console.log(`💾 [MESSAGE_REPOSITORY] Inserting message into ${this.tableName}`);
    
    const created = await this.create(insertData);
    return this.mapDatabaseRowToRawMessage(created);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .ilike("session_id", `%${phoneNumber}%`)
      .order("id", { ascending: true })
      .limit(1000);

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error fetching by phone from ${this.tableName}:`, error);
      throw error;
    }

    return (data || []).map(row => this.mapDatabaseRowToRawMessage(row));
  }

  async findMessagesAfterTimestamp(timestamp: string): Promise<{ data: RawMessage[] | null; error: any }> {
    console.log(`🔍 [MESSAGE_REPOSITORY] Finding messages after ${timestamp} in ${this.tableName}`);
    
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .gt('read_at', timestamp)
      .order("id", { ascending: true })
      .limit(1000);

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error fetching messages after timestamp from ${this.tableName}:`, error);
      return { data: null, error };
    }

    const mappedData = (data || []).map(row => this.mapDatabaseRowToRawMessage(row));
    return { data: mappedData, error: null };
  }

  async markAsRead(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as any)
      .update({ 
        read_at: new Date().toISOString() 
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error marking messages as read:`, error);
      throw error;
    }
  }
}

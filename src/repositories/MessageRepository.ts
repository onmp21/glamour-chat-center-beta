
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

  async findAll(limit = 50): Promise<RawMessage[]> {
    console.log(`📋 [MESSAGE_REPOSITORY] Fetching ${limit} messages from ${this.tableName}`);
    
    try {
      // Verificar se a tabela existe primeiro
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', this.tableName)
        .maybeSingle();

      if (!tableExists) {
        console.log(`⚠️ [MESSAGE_REPOSITORY] Table ${this.tableName} does not exist`);
        return [];
      }

      const { data, error } = await supabase
        .from(this.tableName as any)
        .select('*')
        .order('id', { ascending: false })
        .limit(Math.min(limit, 100));

      if (error) {
        console.error(`❌ [MESSAGE_REPOSITORY] Error fetching from ${this.tableName}:`, error);
        return [];
      }

      const messages = (data || []).map(row => this.mapDatabaseRowToRawMessage(row));
      console.log(`✅ [MESSAGE_REPOSITORY] Successfully fetched ${messages.length} messages from ${this.tableName}`);
      return messages;
    } catch (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error in findAll for ${this.tableName}:`, error);
      return [];
    }
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
    
    try {
      const created = await this.create(insertData);
      return this.mapDatabaseRowToRawMessage(created);
    } catch (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error inserting message:`, error);
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    console.log(`🔍 [MESSAGE_REPOSITORY] Finding messages by phone ${phoneNumber} in ${this.tableName}`);
    
    try {
      const { data, error } = await supabase
        .from(this.tableName as any)
        .select('*')
        .ilike("session_id", `%${phoneNumber}%`)
        .order("id", { ascending: true })
        .limit(100);

      if (error) {
        console.error(`❌ [MESSAGE_REPOSITORY] Error fetching by phone from ${this.tableName}:`, error);
        return [];
      }

      const messages = (data || []).map(row => this.mapDatabaseRowToRawMessage(row));
      console.log(`✅ [MESSAGE_REPOSITORY] Found ${messages.length} messages for phone ${phoneNumber}`);
      return messages;
    } catch (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error in findByPhoneNumber:`, error);
      return [];
    }
  }

  async findMessagesAfterTimestamp(timestamp: string): Promise<{ data: RawMessage[] | null; error: any }> {
    console.log(`🔍 [MESSAGE_REPOSITORY] Finding messages after ${timestamp} in ${this.tableName}`);
    
    try {
      const { data, error } = await supabase
        .from(this.tableName as any)
        .select('*')
        .gt('read_at', timestamp)
        .order("id", { ascending: true })
        .limit(50);

      if (error) {
        console.error(`❌ [MESSAGE_REPOSITORY] Error fetching messages after timestamp from ${this.tableName}:`, error);
        return { data: null, error };
      }

      const mappedData = (data || []).map(row => this.mapDatabaseRowToRawMessage(row));
      console.log(`✅ [MESSAGE_REPOSITORY] Found ${mappedData.length} new messages after ${timestamp}`);
      return { data: mappedData, error: null };
    } catch (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error in findMessagesAfterTimestamp:`, error);
      return { data: null, error };
    }
  }

  async markAsRead(sessionId: string): Promise<void> {
    console.log(`✅ [MESSAGE_REPOSITORY] Marking messages as read for session ${sessionId}`);
    
    try {
      const { error } = await supabase
        .from(this.tableName as any)
        .update({ 
          is_read: true,
          read_at: new Date().toISOString() 
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error(`❌ [MESSAGE_REPOSITORY] Error marking messages as read:`, error);
        throw error;
      }

      console.log(`✅ [MESSAGE_REPOSITORY] Successfully marked messages as read for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error in markAsRead:`, error);
      throw error;
    }
  }
}

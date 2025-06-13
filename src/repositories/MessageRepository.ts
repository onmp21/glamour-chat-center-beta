
import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from './BaseRepository';
import { RawMessage } from '@/types/messages';
import { TableName } from '@/utils/channelMapping';

export class MessageRepository extends BaseRepository<RawMessage> {
  constructor(tableName: TableName) {
    super(tableName);
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
    
    return await this.create(insertData);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike("session_id", `%${phoneNumber}%`)
      .order("id", { ascending: true })
      .limit(1000);

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error fetching by phone from ${this.tableName}:`, error);
      throw error;
    }

    return data || [];
  }

  async findMessagesAfterTimestamp(timestamp: string): Promise<{ data: RawMessage[] | null; error: any }> {
    console.log(`🔍 [MESSAGE_REPOSITORY] Finding messages after ${timestamp} in ${this.tableName}`);
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .gt('read_at', timestamp)      .order("id", { ascending: true })
      .limit(1000);
    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error fetching messages after timestamp from ${this.tableName}:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  async markAsRead(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
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
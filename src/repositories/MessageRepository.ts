
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
      Nome_do_contato: contactName,
      read_at: new Date().toISOString()
    };

    console.log(`💾 [MESSAGE_REPOSITORY] Inserting message into ${this.tableName}`);
    
    return await this.create(insertData);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<RawMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .ilike('session_id', `%${phoneNumber}%`)
      .order('id', { ascending: true });

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error fetching by phone from ${this.tableName}:`, error);
      throw error;
    }

    return data || [];
  }

  async markAsRead(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('session_id', sessionId)
      .eq('is_read', false);

    if (error) {
      console.error(`❌ [MESSAGE_REPOSITORY] Error marking messages as read:`, error);
      throw error;
    }
  }

  private get supabase() {
    return require('@/integrations/supabase/client').supabase;
  }
}

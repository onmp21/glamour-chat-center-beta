
import { supabase } from '@/integrations/supabase/client';
import { TableName } from '@/utils/channelMapping';

export abstract class BaseRepository<T> {
  protected tableName: TableName;

  constructor(tableName: TableName) {
    this.tableName = tableName;
  }

  get tableNamePublic(): string {
    return this.tableName;
  }

  async findAll(): Promise<T[]> {
    console.log(`🔍 [BASE_REPOSITORY] Fetching all from ${this.tableName}`);
    
    // Incluir media_base64 na seleção
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, media_base64')
      .order('id', { ascending: true });

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error fetching from ${this.tableName}:`, error);
      throw error;
    }

    console.log(`✅ [BASE_REPOSITORY] Found ${data?.length || 0} records in ${this.tableName}`);
    return (data || []) as T[];
  }

  async create(data: Partial<T>): Promise<T> {
    console.log(`💾 [BASE_REPOSITORY] Creating in ${this.tableName}`);
    
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data as any)
      .select('*, media_base64')
      .single();

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error creating in ${this.tableName}:`, error);
      throw error;
    }

    console.log(`✅ [BASE_REPOSITORY] Created successfully in ${this.tableName}`);
    return result as T;
  }

  createRealtimeChannel(channelSuffix: string = '') {
    return supabase.channel(`${this.tableName}${channelSuffix}`);
  }
}

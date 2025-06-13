
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

  async findAll(limit?: number, offset?: number): Promise<T[]> {
    try {
      console.log(`🔍 [BASE_REPOSITORY] Fetching all from ${this.tableName} with limit ${limit} and offset ${offset}`);
      
      let query = supabase
        .from(this.tableName)
        .select("*")
        .order("id", { ascending: true });

      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ [BASE_REPOSITORY] Error fetching from ${this.tableName}:`, error);
        throw error;
      }

      console.log(`✅ [BASE_REPOSITORY] Found ${data?.length || 0} records in ${this.tableName}`);
      return data || [];
    } catch (error) {
      console.error(`❌ [BASE_REPOSITORY] Error in findAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data as any)
      .select('*')
      .single();

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error creating in ${this.tableName}:`, error);
      throw error;
    }

    console.log(`✅ [BASE_REPOSITORY] Created successfully in ${this.tableName}`);
    return result as T;
  }

  createRealtimeChannel(channelSuffix: string = "") {
    return supabase.channel(`${this.tableName}${channelSuffix}`);
  }

  async countAll(): Promise<number> {
    try {
      console.log(`🔍 [BASE_REPOSITORY] Counting all from ${this.tableName}`);
      const { count, error } = await supabase
        .from(this.tableName)
        .select("count", { count: "exact" });

      if (error) {
        console.error(`❌ [BASE_REPOSITORY] Error counting from ${this.tableName}:`, error);
        throw error;
      }

      console.log(`✅ [BASE_REPOSITORY] Found ${count || 0} records in ${this.tableName}`);
      return count || 0;
    } catch (error) {
      console.error(`❌ [BASE_REPOSITORY] Error in countAll for ${this.tableName}:`, error);
      throw error;
    }
  }
}
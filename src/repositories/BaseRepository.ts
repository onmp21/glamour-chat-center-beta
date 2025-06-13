
import { supabase } from '@/integrations/supabase/client';

export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Make tableName accessible to subclasses and services
  public getTableName(): string {
    return this.tableName;
  }

  async findAll(limit?: number): Promise<T[]> {
    const query = supabase
      .from(this.tableName as any)
      .select('*')
      .order('id', { ascending: false });

    if (limit) {
      query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error fetching from ${this.tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  }

  async findById(id: string | number): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error fetching by ID from ${this.tableName}:`, error);
      throw error;
    }

    return data as T | null;
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await supabase
      .from(this.tableName as any)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error creating in ${this.tableName}:`, error);
      throw error;
    }

    return created as T;
  }

  async update(id: string | number, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await supabase
      .from(this.tableName as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error updating in ${this.tableName}:`, error);
      throw error;
    }

    return updated as T;
  }

  async delete(id: string | number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ [BASE_REPOSITORY] Error deleting from ${this.tableName}:`, error);
      throw error;
    }
  }
}

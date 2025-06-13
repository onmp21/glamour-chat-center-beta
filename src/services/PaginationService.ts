
import { supabase } from '@/integrations/supabase/client';

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export class PaginationService {
  static async getPaginatedData<T = any>(
    tableName: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const { limit = 20, cursor, sortBy = 'created_at', sortOrder = 'desc' } = options;

    let query = supabase
      .from(tableName as any)
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit + 1); // Get one extra to check if there are more

    if (cursor) {
      const operator = sortOrder === 'asc' ? 'gt' : 'lt';
      query = query.filter(sortBy, operator, cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const results = (data as T[]) || [];
    const hasMore = results.length > limit;
    
    if (hasMore) {
      results.pop(); // Remove the extra item
    }

    const nextCursor = hasMore && results.length > 0 
      ? (results[results.length - 1] as any)?.[sortBy]
      : undefined;

    return {
      data: results,
      nextCursor,
      hasMore,
      total: results.length
    };
  }

  static async getPaginatedConversations(
    channelId: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<any>> {
    try {
      // For now, we'll use direct table queries since the RPC function isn't available
      const tableName = this.getTableNameForChannel(channelId);
      return await this.getPaginatedData(tableName, options);
    } catch (error) {
      console.error('Error getting paginated conversations:', error);
      return {
        data: [],
        hasMore: false,
        total: 0
      };
    }
  }

  private static getTableNameForChannel(channelId: string): string {
    // Map channel IDs to table names
    const channelTableMap: Record<string, string> = {
      'canarana': 'canarana_conversas',
      'souto_soares': 'souto_soares_conversas',
      'joao_dourado': 'joao_dourado_conversas',
      'america_dourada': 'america_dourada_conversas',
      'gerente_externo': 'gerente_externo_conversas',
      'gerente_lojas': 'gerente_lojas_conversas',
      'yelena_ai': 'yelena_ai_conversas'
    };

    return channelTableMap[channelId] || 'canarana_conversas';
  }
}

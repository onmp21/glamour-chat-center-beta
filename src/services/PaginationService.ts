
import { supabase } from '@/integrations/supabase/client';
import { RawMessage, CursorPaginationResult } from '@/types/messages';
import { TableName } from '@/utils/channelMapping';

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export class PaginationService {
  async getPaginatedMessages(
    tableName: TableName,
    options: PaginationOptions = {}
  ): Promise<CursorPaginationResult<RawMessage>> {
    const {
      limit = 50,
      cursor,
      sortField = 'id',
      sortDirection = 'desc'
    } = options;

    try {
      let query = supabase
        .from(tableName)
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' })
        .limit(limit + 1); // +1 to check if there are more records

      // Apply cursor-based pagination
      if (cursor) {
        const operator = sortDirection === 'asc' ? 'gt' : 'lt';
        query = query[operator](sortField, cursor);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ [PAGINATION_SERVICE] Error fetching paginated data from ${tableName}:`, error);
        throw error;
      }

      const messages = (data || []).map(this.mapDatabaseRowToRawMessage);
      const hasMore = messages.length > limit;
      
      if (hasMore) {
        messages.pop(); // Remove the extra record used for hasMore check
      }

      const nextCursor = hasMore && messages.length > 0
        ? messages[messages.length - 1][sortField as keyof RawMessage]?.toString()
        : undefined;

      return {
        data: messages,
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error(`❌ [PAGINATION_SERVICE] Pagination error:`, error);
      throw error;
    }
  }

  async getPaginatedConversations(
    tableName: TableName,
    options: PaginationOptions = {}
  ): Promise<CursorPaginationResult<any>> {
    const {
      limit = 20,
      cursor,
      sortField = 'last_message_time',
      sortDirection = 'desc'
    } = options;

    try {
      // Get unique conversations with latest message info
      const { data: conversations, error } = await supabase
        .rpc('get_paginated_conversations', {
          table_name: tableName,
          page_limit: limit + 1,
          cursor_value: cursor,
          sort_field: sortField,
          sort_direction: sortDirection
        });

      if (error) {
        console.error(`❌ [PAGINATION_SERVICE] Error fetching paginated conversations:`, error);
        throw error;
      }

      const hasMore = conversations && conversations.length > limit;
      
      if (hasMore && conversations) {
        conversations.pop(); // Remove the extra record
      }

      const nextCursor = hasMore && conversations && conversations.length > 0
        ? conversations[conversations.length - 1][sortField]
        : undefined;

      return {
        data: conversations || [],
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error(`❌ [PAGINATION_SERVICE] Conversation pagination error:`, error);
      throw error;
    }
  }

  private mapDatabaseRowToRawMessage(row: any): RawMessage {
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

  async searchMessages(
    tableName: TableName,
    searchTerm: string,
    options: PaginationOptions = {}
  ): Promise<CursorPaginationResult<RawMessage>> {
    const {
      limit = 50,
      cursor,
      sortField = 'id',
      sortDirection = 'desc'
    } = options;

    try {
      let query = supabase
        .from(tableName)
        .select('*')
        .or(`message.ilike.%${searchTerm}%,Nome_do_contato.ilike.%${searchTerm}%,session_id.ilike.%${searchTerm}%`)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .limit(limit + 1);

      if (cursor) {
        const operator = sortDirection === 'asc' ? 'gt' : 'lt';
        query = query[operator](sortField, cursor);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ [PAGINATION_SERVICE] Error searching messages:`, error);
        throw error;
      }

      const messages = (data || []).map(this.mapDatabaseRowToRawMessage);
      const hasMore = messages.length > limit;
      
      if (hasMore) {
        messages.pop();
      }

      const nextCursor = hasMore && messages.length > 0
        ? messages[messages.length - 1][sortField as keyof RawMessage]?.toString()
        : undefined;

      return {
        data: messages,
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error(`❌ [PAGINATION_SERVICE] Search error:`, error);
      throw error;
    }
  }

  async getMessagesByDateRange(
    tableName: TableName,
    startDate: string,
    endDate: string,
    options: PaginationOptions = {}
  ): Promise<CursorPaginationResult<RawMessage>> {
    const {
      limit = 50,
      cursor,
      sortField = 'read_at',
      sortDirection = 'desc'
    } = options;

    try {
      let query = supabase
        .from(tableName)
        .select('*')
        .gte('read_at', startDate)
        .lte('read_at', endDate)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .limit(limit + 1);

      if (cursor) {
        const operator = sortDirection === 'asc' ? 'gt' : 'lt';
        query = query[operator](sortField, cursor);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ [PAGINATION_SERVICE] Error fetching messages by date range:`, error);
        throw error;
      }

      const messages = (data || []).map(this.mapDatabaseRowToRawMessage);
      const hasMore = messages.length > limit;
      
      if (hasMore) {
        messages.pop();
      }

      const nextCursor = hasMore && messages.length > 0
        ? messages[messages.length - 1][sortField as keyof RawMessage]?.toString()
        : undefined;

      return {
        data: messages,
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error(`❌ [PAGINATION_SERVICE] Date range error:`, error);
      throw error;
    }
  }
}

export const paginationService = new PaginationService();

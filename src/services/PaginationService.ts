export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CursorPaginationOptions {
  limit: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export class PaginationService {
  /**
   * Implementa paginação offset-based para grandes volumes de dados
   */
  static async paginateQuery<T>(
    tableName: string,
    options: PaginationOptions
  ): Promise<PaginationResult<T>> {
    try {
      console.log('📄 [PAGINATION] Iniciando paginação offset-based:', {
        tableName,
        page: options.page,
        limit: options.limit,
        sortBy: options.sortBy,
        filters: options.filters
      });

      const { page, limit, sortBy = 'id', sortOrder = 'desc', filters } = options;
      const offset = (page - 1) * limit;

      // Construir query base
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Aplicar ordenação e paginação
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ [PAGINATION] Erro na query:', error);
        throw error;
      }

      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      const result: PaginationResult<T> = {
        data: (data || []) as T[],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };

      console.log('✅ [PAGINATION] Paginação concluída:', {
        itemsReturned: result.data.length,
        totalItems,
        totalPages,
        currentPage: page
      });

      return result;

    } catch (error) {
      console.error('❌ [PAGINATION] Erro na paginação:', error);
      throw error;
    }
  }

  /**
   * Implementa paginação cursor-based para melhor performance em grandes datasets
   */
  static async paginateWithCursor<T>(
    tableName: string,
    options: CursorPaginationOptions
  ): Promise<CursorPaginationResult<T>> {
    try {
      console.log('🔄 [CURSOR_PAGINATION] Iniciando paginação cursor-based:', {
        tableName,
        limit: options.limit,
        cursor: options.cursor,
        sortBy: options.sortBy
      });

      const { limit, cursor, sortBy = 'id', sortOrder = 'desc', filters } = options;

      // Construir query base
      let query = supabase
        .from(tableName)
        .select('*');

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Aplicar cursor se fornecido
      if (cursor) {
        if (sortOrder === 'asc') {
          query = query.gt(sortBy, cursor);
        } else {
          query = query.lt(sortBy, cursor);
        }
      }

      // Buscar um item a mais para verificar se há próxima página
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit + 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ [CURSOR_PAGINATION] Erro na query:', error);
        throw error;
      }

      const items = (data || []) as T[];
      const hasMore = items.length > limit;
      
      // Remover o item extra se existir
      if (hasMore) {
        items.pop();
      }

      // Determinar próximo cursor
      let nextCursor: string | undefined;
      if (hasMore && items.length > 0) {
        const lastItem = items[items.length - 1] as any;
        nextCursor = lastItem[sortBy];
      }

      const result: CursorPaginationResult<T> = {
        data: items,
        nextCursor,
        hasMore
      };

      console.log('✅ [CURSOR_PAGINATION] Paginação concluída:', {
        itemsReturned: result.data.length,
        hasMore,
        nextCursor
      });

      return result;

    } catch (error) {
      console.error('❌ [CURSOR_PAGINATION] Erro na paginação:', error);
      throw error;
    }
  }

  /**
   * Paginação otimizada para mensagens (mais recentes primeiro)
   */
  static async paginateMessages<T>(
    tableName: string,
    sessionId?: string,
    options: Partial<CursorPaginationOptions> = {}
  ): Promise<CursorPaginationResult<T>> {
    const defaultOptions: CursorPaginationOptions = {
      limit: 50,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      ...options
    };

    // Adicionar filtro de sessão se fornecido
    if (sessionId) {
      defaultOptions.filters = {
        ...defaultOptions.filters,
        session_id: sessionId
      };
    }

    return this.paginateWithCursor<T>(tableName, defaultOptions);
  }

  /**
   * Busca com paginação e pesquisa de texto
   */
  static async searchWithPagination<T>(
    tableName: string,
    searchTerm: string,
    searchFields: string[],
    options: Partial<PaginationOptions> = {}
  ): Promise<PaginationResult<T>> {
    try {
      console.log('🔍 [SEARCH_PAGINATION] Iniciando busca paginada:', {
        tableName,
        searchTerm,
        searchFields,
        options
      });

      const defaultOptions: PaginationOptions = {
        page: 1,
        limit: 20,
        sortBy: 'id',
        sortOrder: 'desc',
        ...options
      };

      const { page, limit, sortBy, sortOrder } = defaultOptions;
      const offset = (page - 1) * limit;

      // Construir query de busca
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' });

      // Aplicar busca em múltiplos campos
      if (searchTerm && searchFields.length > 0) {
        const searchConditions = searchFields.map(field => 
          `${field}.ilike.%${searchTerm}%`
        ).join(',');
        
        query = query.or(searchConditions);
      }

      // Aplicar ordenação e paginação
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ [SEARCH_PAGINATION] Erro na busca:', error);
        throw error;
      }

      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      const result: PaginationResult<T> = {
        data: (data || []) as T[],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };

      console.log('✅ [SEARCH_PAGINATION] Busca concluída:', {
        searchTerm,
        itemsFound: result.data.length,
        totalItems
      });

      return result;

    } catch (error) {
      console.error('❌ [SEARCH_PAGINATION] Erro na busca:', error);
      throw error;
    }
  }

  /**
   * Paginação com agregações (contadores, somas, etc.)
   */
  static async paginateWithAggregations<T>(
    tableName: string,
    options: PaginationOptions,
    aggregations?: {
      count?: string[];
      sum?: string[];
      avg?: string[];
    }
  ): Promise<PaginationResult<T> & { aggregations?: Record<string, any> }> {
    try {
      console.log('📊 [AGGREGATION_PAGINATION] Iniciando paginação com agregações:', {
        tableName,
        options,
        aggregations
      });

      // Buscar dados paginados
      const paginatedResult = await this.paginateQuery<T>(tableName, options);

      // Buscar agregações se solicitadas
      let aggregationResults: Record<string, any> = {};
      
      if (aggregations) {
        // Construir query para agregações
        let aggQuery = supabase.from(tableName);

        // Aplicar mesmos filtros da paginação
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (typeof value === 'string' && value.includes('%')) {
                aggQuery = aggQuery.ilike(key, value);
              } else {
                aggQuery = aggQuery.eq(key, value);
              }
            }
          });
        }

        // Executar agregações (simplificado - em produção usaria funções SQL)
        const { data: allData } = await aggQuery.select('*');
        
        if (allData) {
          // Calcular agregações manualmente
          if (aggregations.count) {
            aggregations.count.forEach(field => {
              aggregationResults[`${field}_count`] = allData.filter(item => 
                (item as any)[field] !== null && (item as any)[field] !== undefined
              ).length;
            });
          }

          if (aggregations.sum) {
            aggregations.sum.forEach(field => {
              aggregationResults[`${field}_sum`] = allData.reduce((sum, item) => 
                sum + (Number((item as any)[field]) || 0), 0
              );
            });
          }

          if (aggregations.avg) {
            aggregations.avg.forEach(field => {
              const values = allData.map(item => Number((item as any)[field]) || 0);
              const sum = values.reduce((a, b) => a + b, 0);
              aggregationResults[`${field}_avg`] = values.length > 0 ? sum / values.length : 0;
            });
          }
        }
      }

      console.log('✅ [AGGREGATION_PAGINATION] Paginação com agregações concluída:', {
        itemsReturned: paginatedResult.data.length,
        aggregations: aggregationResults
      });

      return {
        ...paginatedResult,
        aggregations: aggregationResults
      };

    } catch (error) {
      console.error('❌ [AGGREGATION_PAGINATION] Erro na paginação com agregações:', error);
      throw error;
    }
  }
}


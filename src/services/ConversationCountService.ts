
import { supabase } from '@/integrations/supabase/client';

export class ConversationCountService {
  private static cache: Map<string, { count: number; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 60000; // 1 minuto

  // Mapear channelId para nome da tabela
  private static getTableNameForChannel(channelId: string): string {
    const channelMapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };
    
    return channelMapping[channelId] || 'yelena_ai_conversas';
  }

  static async getConversationCount(channelId: string): Promise<number> {
    const cacheKey = `count-${channelId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📊 [COUNT_SERVICE] Cache hit for ${channelId}: ${cached.count}`);
      return cached.count;
    }

    try {
      const tableName = this.getTableNameForChannel(channelId);
      console.log(`🔢 [COUNT_SERVICE] Counting conversations for ${channelId} in ${tableName}`);
      
      // Query para pegar todos os session_ids únicos
      const { data, error } = await supabase
        .from(tableName as any)
        .select('session_id');

      if (error) {
        console.error(`❌ [COUNT_SERVICE] Error counting for ${channelId}:`, error);
        return 0;
      }

      // Contar session_ids únicos
      const uniqueSessions = new Set(data?.map(item => item.session_id) || []);
      const count = uniqueSessions.size;
      
      // Cache o resultado
      this.cache.set(cacheKey, { count, timestamp: Date.now() });
      
      console.log(`✅ [COUNT_SERVICE] Found ${count} unique conversations for ${channelId}`);
      return count;
    } catch (error) {
      console.error(`❌ [COUNT_SERVICE] Error in getConversationCount for ${channelId}:`, error);
      return 0;
    }
  }

  static async getUnreadCount(channelId: string): Promise<number> {
    const cacheKey = `unread-${channelId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.count;
    }

    try {
      const tableName = this.getTableNameForChannel(channelId);
      
      // Query otimizada - só conta mensagens não lidas
      const { count, error } = await supabase
        .from(tableName as any)
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error(`❌ [COUNT_SERVICE] Error counting unread for ${channelId}:`, error);
        return 0;
      }

      const unreadCount = count || 0;
      this.cache.set(cacheKey, { count: unreadCount, timestamp: Date.now() });
      
      return unreadCount;
    } catch (error) {
      console.error(`❌ [COUNT_SERVICE] Error in getUnreadCount for ${channelId}:`, error);
      return 0;
    }
  }

  static clearCache() {
    this.cache.clear();
    console.log('🧹 [COUNT_SERVICE] Cache cleared');
  }

  static clearChannelCache(channelId: string) {
    this.cache.delete(`count-${channelId}`);
    this.cache.delete(`unread-${channelId}`);
    console.log(`🧹 [COUNT_SERVICE] Cache cleared for ${channelId}`);
  }
}


import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannel } from '@/utils/channelMapping';

export class ConversationCountService {
  private static cache: Map<string, { count: number; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 30000; // 30 segundos - cache mínimo apenas para evitar múltiplas chamadas simultâneas

  static async getConversationCount(channelId: string): Promise<number> {
    const cacheKey = `count-${channelId}`;
    const cached = this.cache.get(cacheKey);
    
    // Cache muito reduzido - realtime deve atualizar rapidamente
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📊 [COUNT_SERVICE] Cache hit for ${channelId}: ${cached.count}`);
      return cached.count;
    }

    try {
      const tableName = await getTableNameForChannel(channelId);
      console.log(`🔢 [COUNT_SERVICE] Counting conversations for ${channelId} in ${tableName}`);
      
      // Query otimizada - contar session_ids únicos
      const { data, error } = await supabase
        .from(tableName as any)
        .select('session_id')
        .order('read_at', { ascending: false });

      if (error) {
        console.error(`❌ [COUNT_SERVICE] Error counting for ${channelId}:`, error);
        return 0;
      }

      // Contar conversas únicas - check if data exists and is array
      let count = 0;
      if (data && Array.isArray(data)) {
        const uniqueSessions = new Set(data.map((row: any) => row.session_id));
        count = uniqueSessions.size;
      }
      
      // Cache o resultado por tempo mínimo
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
    
    // Cache muito reduzido - realtime deve atualizar rapidamente
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.count;
    }

    try {
      const tableName = await getTableNameForChannel(channelId);
      
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

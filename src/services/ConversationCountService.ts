
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannel } from '@/utils/channelMapping';

export class ConversationCountService {
  private static cache: Map<string, { count: number; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 60000; // 1 minuto

  static async getConversationCount(channelId: string): Promise<number> {
    const cacheKey = `count-${channelId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📊 [COUNT_SERVICE] Cache hit for ${channelId}: ${cached.count}`);
      return cached.count;
    }

    try {
      const tableName = getTableNameForChannel(channelId);
      console.log(`🔢 [COUNT_SERVICE] Counting conversations for ${channelId} in ${tableName}`);
      
      // Query otimizada - só conta session_ids únicos
      const { data, error } = await supabase
        .from(tableName as any)
        .select('session_id', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ [COUNT_SERVICE] Error counting for ${channelId}:`, error);
        return 0;
      }

      // Contar session_ids únicos seria mais preciso, mas count já nos dá uma aproximação
      const count = data?.length || 0;
      
      // Cache o resultado
      this.cache.set(cacheKey, { count, timestamp: Date.now() });
      
      console.log(`✅ [COUNT_SERVICE] Found ${count} conversations for ${channelId}`);
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
      const tableName = getTableNameForChannel(channelId);
      
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

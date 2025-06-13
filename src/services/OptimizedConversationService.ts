
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannel } from '@/utils/channelMapping';
import { ChannelConversation } from '@/types/messages';

export class OptimizedConversationService {
  private static cache: Map<string, { data: ChannelConversation[]; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 30000; // 30 segundos

  static async getConversationsList(channelId: string, limit = 20): Promise<ChannelConversation[]> {
    const cacheKey = `conversations-${channelId}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📋 [OPTIMIZED_CONVERSATIONS] Cache hit for ${channelId}`);
      return cached.data;
    }

    try {
      const tableName = getTableNameForChannel(channelId);
      console.log(`📋 [OPTIMIZED_CONVERSATIONS] Loading conversations list for ${channelId}`);
      
      // Query otimizada - só os campos essenciais para listar conversas
      const { data, error } = await supabase
        .from(tableName as any)
        .select('session_id, nome_do_contato, Nome_do_contato, read_at, is_read, message')
        .order('read_at', { ascending: false })
        .limit(limit * 2) // Pegamos mais para filtrar duplicatas
        .abortSignal(AbortSignal.timeout(8000));

      if (error) {
        console.error(`❌ [OPTIMIZED_CONVERSATIONS] Error loading for ${channelId}:`, error);
        return [];
      }

      // Processar dados para criar lista de conversas únicas
      const conversationsMap = new Map<string, ChannelConversation>();
      
      (data || []).forEach((row: any) => {
        const sessionId = row.session_id;
        if (!conversationsMap.has(sessionId)) {
          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: row.nome_do_contato || row.Nome_do_contato || 'Contato Anônimo',
            contact_phone: this.extractPhoneFromSessionId(sessionId),
            last_message: row.message || '[Sem mensagem]',
            last_message_time: row.read_at || new Date().toISOString(),
            status: row.is_read ? 'resolved' : 'unread',
            updated_at: row.read_at || new Date().toISOString(),
            unread_count: row.is_read ? 0 : 1
          });
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .slice(0, limit)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // Cache resultado
      this.cache.set(cacheKey, { data: conversations, timestamp: Date.now() });
      
      console.log(`✅ [OPTIMIZED_CONVERSATIONS] Loaded ${conversations.length} conversations for ${channelId}`);
      return conversations;
    } catch (error) {
      console.error(`❌ [OPTIMIZED_CONVERSATIONS] Error in getConversationsList:`, error);
      return [];
    }
  }

  private static extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }

  static clearCache() {
    this.cache.clear();
    console.log('🧹 [OPTIMIZED_CONVERSATIONS] Cache cleared');
  }

  static clearChannelCache(channelId: string) {
    // Remove todas as entradas de cache relacionadas ao canal
    for (const key of this.cache.keys()) {
      if (key.includes(channelId)) {
        this.cache.delete(key);
      }
    }
    console.log(`🧹 [OPTIMIZED_CONVERSATIONS] Cache cleared for ${channelId}`);
  }
}

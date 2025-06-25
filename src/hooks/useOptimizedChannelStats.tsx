
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import { useRealtimeSubscriptionManager } from './useRealtimeSubscriptionManager';

interface ChannelStats {
  totalConversations: number;
  unreadMessages: number;
  loading: boolean;
  error: string | null;
}

export const useOptimizedChannelStats = (channelId: string | null) => {
  const [stats, setStats] = useState<ChannelStats>({
    totalConversations: 0,
    unreadMessages: 0,
    loading: false,
    error: null
  });

  const { createSubscription, removeSubscription } = useRealtimeSubscriptionManager();

  const loadStats = useCallback(async () => {
    if (!channelId) {
      setStats(prev => ({ ...prev, totalConversations: 0, unreadMessages: 0 }));
      return;
    }

    setStats(prev => ({ ...prev, loading: true, error: null }));

    try {
      const tableName = getTableNameForChannelSync(channelId);
      
      // Query otimizada - contar conversas únicas (session_ids únicos)
      const { data: conversationsData, error: conversationsError } = await supabase
        .from(tableName as any)
        .select('session_id')
        .not('session_id', 'is', null);

      // Query otimizada - contar mensagens não lidas (apenas de contatos externos)
      const { count: unreadCount, error: unreadError } = await supabase
        .from(tableName as any)
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('tipo_remetente', 'USUARIO_INTERNO');

      if (conversationsError || unreadError) {
        console.error('❌ [OPTIMIZED_CHANNEL_STATS] Error:', conversationsError || unreadError);
        setStats(prev => ({ 
          ...prev, 
          loading: false, 
          error: (conversationsError || unreadError)?.message || 'Erro ao carregar estatísticas' 
        }));
        return;
      }

      // Contar conversas únicas sem duplicatas
      const uniqueConversations = conversationsData 
        ? new Set(conversationsData.map((row: any) => row.session_id).filter(Boolean)).size 
        : 0;

      setStats({
        totalConversations: uniqueConversations,
        unreadMessages: unreadCount || 0,
        loading: false,
        error: null
      });

      console.log(`📊 [OPTIMIZED_CHANNEL_STATS] Channel ${channelId}: ${uniqueConversations} conversas, ${unreadCount || 0} não lidas`);
    } catch (err) {
      console.error('❌ [OPTIMIZED_CHANNEL_STATS] Unexpected error:', err);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Erro inesperado' 
      }));
    }
  }, [channelId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!channelId) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[OPTIMIZED_CHANNEL_STATS] No table mapping found for channel: ${channelId}`);
      return;
    }

    const channelName = `channel_stats_${tableName}_${Date.now()}`;

    // Criar subscrição realtime
    createSubscription(channelName, {
      tableName,
      callback: () => {
        console.log('🔄 [OPTIMIZED_CHANNEL_STATS] Realtime update received, reloading stats');
        loadStats();
      }
    });

    // Load inicial
    loadStats();

    return () => {
      removeSubscription(channelName);
    };
  }, [channelId, createSubscription, removeSubscription, loadStats]);

  return stats;
};

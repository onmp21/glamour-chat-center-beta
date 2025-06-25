
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getTableNameForChannelSync } from '@/utils/channelMapping';

interface ChannelStats {
  totalConversations: number;
  unreadMessages: number;
  loading: boolean;
  error: string | null;
}

export const useRealtimeChannelStats = (channelId: string | null) => {
  const [stats, setStats] = useState<ChannelStats>({
    totalConversations: 0,
    unreadMessages: 0,
    loading: false,
    error: null
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const loadStats = async () => {
    if (!channelId) {
      setStats(prev => ({ ...prev, totalConversations: 0, unreadMessages: 0 }));
      return;
    }

    setStats(prev => ({ ...prev, loading: true, error: null }));

    try {
      const tableName = getTableNameForChannelSync(channelId);
      
      // Contar conversas únicas (session_ids únicos) - query mais específica
      const { data: conversationsData, error: conversationsError } = await supabase
        .from(tableName as any)
        .select('session_id')
        .not('session_id', 'is', null);

      // Contar mensagens não lidas (apenas de contatos externos)
      const { count: unreadCount, error: unreadError } = await supabase
        .from(tableName as any)
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('tipo_remetente', 'USUARIO_INTERNO');

      if (conversationsError || unreadError) {
        console.error('❌ [REALTIME_CHANNEL_STATS] Error:', conversationsError || unreadError);
        setStats(prev => ({ 
          ...prev, 
          loading: false, 
          error: (conversationsError || unreadError)?.message || 'Erro ao carregar estatísticas' 
        }));
        return;
      }

      // Contar conversas únicas - corrigido para evitar contagem duplicada
      let uniqueConversations = 0;
      if (conversationsData && Array.isArray(conversationsData)) {
        const uniqueSessions = new Set(
          conversationsData
            .map((row: any) => row.session_id)
            .filter(sessionId => sessionId && sessionId.trim() !== '')
        );
        uniqueConversations = uniqueSessions.size;
      }

      if (mountedRef.current) {
        setStats({
          totalConversations: uniqueConversations,
          unreadMessages: unreadCount || 0,
          loading: false,
          error: null
        });
      }
    } catch (err) {
      console.error('❌ [REALTIME_CHANNEL_STATS] Unexpected error:', err);
      if (mountedRef.current) {
        setStats(prev => ({ 
          ...prev, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Erro inesperado' 
        }));
      }
    }
  };

  // Setup Supabase realtime - APENAS REALTIME NATIVO
  useEffect(() => {
    mountedRef.current = true;
    
    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!channelId) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[REALTIME_CHANNEL_STATS] No table mapping found for channel: ${channelId}`);
      return;
    }

    console.log(`✅ [REALTIME_CHANNEL_STATS] Setting up realtime for ${tableName}`);

    // Create Supabase realtime channel
    const channel = supabase
      .channel(`channel_stats_${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log('🔥 [REALTIME_CHANNEL_STATS] Database change:', payload);
          
          if (mountedRef.current) {
            // Recarregar estatísticas quando há mudanças
            loadStats();
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME_CHANNEL_STATS] Subscription status for ${tableName}:`, status);
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      
      if (channelRef.current) {
        console.log(`🔌 [REALTIME_CHANNEL_STATS] Cleaning up realtime subscription for ${tableName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelId]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [channelId]);

  return stats;
};

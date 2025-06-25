
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ConversationStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  loading: boolean;
  error: string | null;
}

// Mapeamento de canais e tabelas
const CHANNEL_TABLES = [
  'yelena_ai_conversas',
  'canarana_conversas',
  'souto_soares_conversas',
  'joao_dourado_conversas',
  'america_dourada_conversas',
  'gerente_lojas_conversas',
  'gerente_externo_conversas'
];

export const useOptimizedConversationStatsRealtime = () => {
  const [stats, setStats] = useState<ConversationStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    loading: true,
    error: null
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      let totalConversations = 0;
      let pendingCount = 0;
      let inProgressCount = 0;
      let resolvedCount = 0;

      // Carregar estatísticas de todas as tabelas
      for (const tableName of CHANNEL_TABLES) {
        try {
          // Contar conversas únicas por session_id
          const { data: conversationsData, error: conversationsError } = await supabase
            .from(tableName as any)
            .select('session_id')
            .not('session_id', 'is', null);

          if (conversationsError) {
            console.error(`❌ [STATS_REALTIME] Error loading ${tableName}:`, conversationsError);
            continue;
          }

          // Contar sessões únicas
          const uniqueSessions = new Set(
            (conversationsData || [])
              .map((row: any) => row.session_id)
              .filter(sessionId => sessionId && sessionId.trim() !== '')
          );

          totalConversations += uniqueSessions.size;

          // Para simplificar, considerar todas as conversas como "pending" por padrão
          // Você pode ajustar essa lógica conforme seu sistema de status
          uniqueSessions.forEach(sessionId => {
            const statusKey = `conversation_status_${tableName}_${sessionId}`;
            const status = localStorage.getItem(statusKey) || 'unread';
            
            switch (status) {
              case 'unread':
                pendingCount++;
                break;
              case 'in_progress':
                inProgressCount++;
                break;
              case 'resolved':
                resolvedCount++;
                break;
              default:
                pendingCount++;
            }
          });

        } catch (error) {
          console.error(`❌ [STATS_REALTIME] Error processing ${tableName}:`, error);
        }
      }

      if (mountedRef.current) {
        setStats({
          total: totalConversations,
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          loading: false,
          error: null
        });
      }

    } catch (error) {
      console.error('❌ [STATS_REALTIME] Global error:', error);
      if (mountedRef.current) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar estatísticas'
        }));
      }
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    mountedRef.current = true;

    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('✅ [STATS_REALTIME] Setting up realtime subscriptions');

    // Criar subscrição única para todas as tabelas
    const channel = supabase
      .channel('conversation_stats_global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yelena_ai_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in yelena_ai_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canarana_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in canarana_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'souto_soares_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in souto_soares_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'joao_dourado_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in joao_dourado_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'america_dourada_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in america_dourada_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gerente_lojas_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in gerente_lojas_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gerente_externo_conversas'
        },
        () => {
          console.log('🔥 [STATS_REALTIME] Change in gerente_externo_conversas');
          if (mountedRef.current) loadStats();
        }
      )
      .subscribe((status) => {
        console.log('📡 [STATS_REALTIME] Subscription status:', status);
      });

    channelRef.current = channel;

    // Load inicial
    loadStats();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        console.log('🔌 [STATS_REALTIME] Cleaning up subscriptions');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { stats, loading: stats.loading };
};


import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelStats {
  totalConversations: number;
  unreadMessages: number;
  loading: boolean;
  error: string | null;
}

interface GlobalRealtimeStatsContextType {
  getChannelStats: (channelId: string) => ChannelStats;
  refreshStats: () => void;
  isInitialized: boolean;
}

const GlobalRealtimeStatsContext = createContext<GlobalRealtimeStatsContextType>({
  getChannelStats: () => ({ totalConversations: 0, unreadMessages: 0, loading: true, error: null }),
  refreshStats: () => {},
  isInitialized: false
});

// Mapeamento correto de canais para tabelas
const CHANNEL_TABLE_MAPPING: Record<string, string> = {
  'chat': 'yelena_ai_conversas',
  'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
  'canarana': 'canarana_conversas',
  '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
  'souto-soares': 'souto_soares_conversas',
  'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
  'america-dourada': 'america_dourada_conversas',
  '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
  'gerente-lojas': 'gerente_lojas_conversas',
  'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
  'gerente-externo': 'gerente_externo_conversas', // CORRIGIDO
  'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas' // CORRIGIDO
};

export const GlobalRealtimeStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Record<string, ChannelStats>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const loadAllStats = async () => {
    try {
      const newStats: Record<string, ChannelStats> = {};
      
      // Carregar estatísticas para todos os canais
      for (const [channelId, tableName] of Object.entries(CHANNEL_TABLE_MAPPING)) {
        try {
          // Query otimizada para conversas únicas
          const { data: conversationsData, error: conversationsError } = await supabase
            .from(tableName as any)
            .select('session_id')
            .not('session_id', 'is', null);

          // Query otimizada para mensagens não lidas (apenas de contatos externos)
          const { count: unreadCount, error: unreadError } = await supabase
            .from(tableName as any)
            .select('id', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('tipo_remetente', 'USUARIO_INTERNO');

          if (conversationsError || unreadError) {
            console.error(`❌ [GLOBAL_STATS] Error for ${channelId}:`, conversationsError || unreadError);
            newStats[channelId] = {
              totalConversations: 0,
              unreadMessages: 0,
              loading: false,
              error: (conversationsError || unreadError)?.message || 'Erro ao carregar'
            };
            continue;
          }

          // Contar conversas únicas - sem duplicatas
          const uniqueSessions = new Set(
            (conversationsData || [])
              .map((row: any) => row.session_id)
              .filter(sessionId => sessionId && sessionId.trim() !== '')
          );

          newStats[channelId] = {
            totalConversations: uniqueSessions.size,
            unreadMessages: unreadCount || 0,
            loading: false,
            error: null
          };

          console.log(`📊 [GLOBAL_STATS] ${channelId}: ${uniqueSessions.size} conversas, ${unreadCount || 0} não lidas`);
        } catch (error) {
          console.error(`❌ [GLOBAL_STATS] Error loading ${channelId}:`, error);
          newStats[channelId] = {
            totalConversations: 0,
            unreadMessages: 0,
            loading: false,
            error: 'Erro inesperado'
          };
        }
      }

      if (mountedRef.current) {
        setStats(newStats);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('❌ [GLOBAL_STATS] Global error:', error);
    }
  };

  // Setup ÚNICA subscrição realtime para TODAS as tabelas
  useEffect(() => {
    mountedRef.current = true;

    // Cleanup anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('✅ [GLOBAL_STATS] Setting up single global realtime subscription');

    // Criar ÚNICA subscrição para todas as tabelas
    const channel = supabase
      .channel('global_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yelena_ai_conversas'
        },
        () => {
          console.log('🔥 [GLOBAL_STATS] Change in yelena_ai_conversas');
          if (mountedRef.current) loadAllStats();
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
          console.log('🔥 [GLOBAL_STATS] Change in canarana_conversas');
          if (mountedRef.current) loadAllStats();
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
          console.log('🔥 [GLOBAL_STATS] Change in souto_soares_conversas');
          if (mountedRef.current) loadAllStats();
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
          console.log('🔥 [GLOBAL_STATS] Change in joao_dourado_conversas');
          if (mountedRef.current) loadAllStats();
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
          console.log('🔥 [GLOBAL_STATS] Change in america_dourada_conversas');
          if (mountedRef.current) loadAllStats();
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
          console.log('🔥 [GLOBAL_STATS] Change in gerente_lojas_conversas');
          if (mountedRef.current) loadAllStats();
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
          console.log('🔥 [GLOBAL_STATS] Change in gerente_externo_conversas');
          if (mountedRef.current) loadAllStats();
        }
      )
      .subscribe((status) => {
        console.log('📡 [GLOBAL_STATS] Global subscription status:', status);
      });

    channelRef.current = channel;

    // Load inicial
    loadAllStats();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        console.log('🔌 [GLOBAL_STATS] Cleaning up global subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const getChannelStats = (channelId: string): ChannelStats => {
    return stats[channelId] || {
      totalConversations: 0,
      unreadMessages: 0,
      loading: !isInitialized,
      error: null
    };
  };

  const refreshStats = () => {
    loadAllStats();
  };

  return (
    <GlobalRealtimeStatsContext.Provider value={{
      getChannelStats,
      refreshStats,
      isInitialized
    }}>
      {children}
    </GlobalRealtimeStatsContext.Provider>
  );
};

export const useGlobalRealtimeStats = () => {
  const context = useContext(GlobalRealtimeStatsContext);
  if (!context) {
    throw new Error('useGlobalRealtimeStats must be used within GlobalRealtimeStatsProvider');
  }
  return context;
};

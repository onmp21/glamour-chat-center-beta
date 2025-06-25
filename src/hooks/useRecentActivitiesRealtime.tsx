
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getAllChannelTables, getChannelDisplayNameSync, CHANNEL_TABLE_MAPPING } from '@/utils/channelMapping';

interface RecentActivity {
  id: string;
  type: 'new_message' | 'status_change' | 'new_conversation';
  title: string;
  description: string;
  lastMessage: string;
  time: string;
  channel: string;
}

export const useRecentActivitiesRealtime = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      console.log('📋 [RECENT_ACTIVITIES] Loading recent activities...');
      
      const allActivities: RecentActivity[] = [];
      const allTables = getAllChannelTables();

      for (const tableName of allTables) {
        try {
          // Buscar mensagens mais recentes de cada tabela
          const { data, error } = await supabase
            .from(tableName as any)
            .select('id, message, nome_do_contato, session_id, read_at, tipo_remetente')
            .order('read_at', { ascending: false })
            .limit(5);

          if (error) {
            console.error(`❌ [RECENT_ACTIVITIES] Error loading ${tableName}:`, error);
            continue;
          }

          // Encontrar channelId correspondente
          const channelId = Object.keys(CHANNEL_TABLE_MAPPING).find(
            key => CHANNEL_TABLE_MAPPING[key] === tableName
          );

          if (!channelId) continue;

          const channelDisplayName = getChannelDisplayNameSync(channelId);
          
          // Processar mensagens em atividades
          data?.forEach((msg: any) => {
            allActivities.push({
              id: `${tableName}_${msg.id}`,
              type: msg.tipo_remetente === 'CONTATO_EXTERNO' ? 'new_message' : 'status_change',
              title: msg.nome_do_contato || 'Contato Desconhecido',
              description: `Nova mensagem em ${channelDisplayName}`,
              lastMessage: msg.message || '[Mídia]',
              time: formatTimeAgo(msg.read_at),
              channel: channelDisplayName
            });
          });

        } catch (error) {
          console.error(`❌ [RECENT_ACTIVITIES] Error processing ${tableName}:`, error);
        }
      }

      // Ordenar por tempo e limitar a 15 atividades
      const sortedActivities = allActivities
        .sort((a, b) => {
          // Ordenar por timestamp mais recente primeiro
          const timeA = a.time === 'Agora' ? Date.now() : parseTimeAgo(a.time);
          const timeB = b.time === 'Agora' ? Date.now() : parseTimeAgo(b.time);
          return timeB - timeA;
        })
        .slice(0, 15);

      if (mountedRef.current) {
        setActivities(sortedActivities);
        setLoading(false);
        console.log(`✅ [RECENT_ACTIVITIES] Loaded ${sortedActivities.length} activities`);
      }

    } catch (error) {
      console.error('❌ [RECENT_ACTIVITIES] Global error:', error);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'Agora';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr === 'Agora') return Date.now();
    
    const match = timeStr.match(/(\d+)(min|h|d) atrás/);
    if (!match) return Date.now();
    
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = Date.now();
    
    switch (unit) {
      case 'min': return now - (value * 60 * 1000);
      case 'h': return now - (value * 60 * 60 * 1000);
      case 'd': return now - (value * 24 * 60 * 60 * 1000);
      default: return now;
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    mountedRef.current = true;

    // Cleanup anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('✅ [RECENT_ACTIVITIES] Setting up realtime subscription');

    // Criar subscrição para mudanças em todas as tabelas
    const channel = supabase.channel('recent_activities_realtime');

    // Adicionar listeners apenas para INSERTs (novas mensagens)
    getAllChannelTables().forEach(tableName => {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`🔥 [RECENT_ACTIVITIES] New message in ${tableName}:`, payload.new);
          if (mountedRef.current) {
            // Debounce para evitar múltiplas atualizações
            setTimeout(() => loadRecentActivities(), 100);
          }
        }
      );
    });

    channel.subscribe((status) => {
      console.log('📡 [RECENT_ACTIVITIES] Subscription status:', status);
    });

    channelRef.current = channel;

    // Load inicial
    loadRecentActivities();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        console.log('🔌 [RECENT_ACTIVITIES] Cleaning up subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { activities, loading };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface ChannelStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  unreadMessages: number;
}

export const useChannelStats = () => {
  const [stats, setStats] = useState<ChannelStats>({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth();

  const getChannelTableMapping = () => {
    return {
      'Yelena-AI': 'yelena_ai_conversas',
      'Canarana': 'canarana_conversas',
      'Souto Soares': 'souto_soares_conversas',
      'João Dourado': 'joao_dourado_conversas',
      'América Dourada': 'america_dourada_conversas',
      'Gustavo Gerente das Lojas': 'gerente_lojas_conversas',
      'Andressa Gerente Externo': 'gerente_externo_conversas'
    };
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const channelMapping = getChannelTableMapping();
      let tablesToQuery: string[] = [];

      if (user.role === 'admin') {
        // Admin pode ver todos os canais ativos, exceto Pedro
        tablesToQuery = channels
          .filter(c => c.isActive && c.name && c.name.toLowerCase() !== 'pedro')
          .map(c => channelMapping[c.name as keyof typeof channelMapping])
          .filter(table => table);
      } else {
        // Usuário comum vê apenas canais acessíveis
        const accessibleChannels = getAccessibleChannels();
        const channelIdToNameMap: Record<string, string> = {
          'chat': 'Yelena-AI',
          'canarana': 'Canarana',
          'souto-soares': 'Souto Soares',
          'joao-dourado': 'João Dourado',
          'america-dourada': 'América Dourada',
          'gerente-lojas': 'Gustavo Gerente das Lojas',
          'gerente-externo': 'Andressa Gerente Externo'
        };

        tablesToQuery = accessibleChannels
          .map(channelId => {
            const channelName = channelIdToNameMap[channelId];
            return channelName ? channelMapping[channelName as keyof typeof channelMapping] : null;
          })
          .filter((table): table is string => table !== null);
      }

      console.log('📊 [CHANNEL_STATS] Querying tables:', tablesToQuery);

      let totalConversations = 0;
      let activeConversations = 0;
      let totalMessages = 0;
      let unreadMessages = 0;

      for (const tableName of tablesToQuery) {
        try {
          // Contar mensagens totais
          const { count: messageCount, error: messageError } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });

          if (messageError) {
            console.error(`❌ [CHANNEL_STATS] Error counting messages in ${tableName}:`, messageError);
            continue;
          }

          totalMessages += messageCount || 0;

          // Contar mensagens não lidas
          const { count: unreadCount, error: unreadError } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('tipo_remetente', 'USUARIO_INTERNO');

          if (unreadError) {
            console.error(`❌ [CHANNEL_STATS] Error counting unread messages in ${tableName}:`, unreadError);
            continue;
          }

          unreadMessages += unreadCount || 0;

          // Contar conversas únicas (session_id únicos)
          const { data: sessions, error: sessionError } = await supabase
            .from(tableName as any)
            .select('session_id')
            .limit(1000); // Limitando para performance

          if (sessionError) {
            console.error(`❌ [CHANNEL_STATS] Error getting sessions from ${tableName}:`, sessionError);
            continue;
          }

          if (sessions && Array.isArray(sessions)) {
            const uniqueSessions = new Set(sessions.map((s: any) => s.session_id));
            totalConversations += uniqueSessions.size;

            // Contar conversas ativas (com mensagens nas últimas 24h)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { data: recentSessions, error: recentError } = await supabase
              .from(tableName as any)
              .select('session_id')
              .gte('read_at', yesterday.toISOString())
              .limit(1000);

            if (recentError) {
              console.error(`❌ [CHANNEL_STATS] Error getting recent sessions from ${tableName}:`, recentError);
              continue;
            }

            if (recentSessions && Array.isArray(recentSessions)) {
              const recentUniqueSessions = new Set(recentSessions.map((s: any) => s.session_id));
              activeConversations += recentUniqueSessions.size;
            }
          }

          console.log(`✅ [CHANNEL_STATS] ${tableName}: ${messageCount} messages, ${totalConversations} conversations`);

        } catch (err) {
          console.error(`❌ [CHANNEL_STATS] Unexpected error for ${tableName}:`, err);
        }
      }

      setStats({
        totalConversations,
        activeConversations,
        totalMessages,
        unreadMessages
      });

      console.log('📊 [CHANNEL_STATS] Final stats:', {
        totalConversations,
        activeConversations,
        totalMessages,
        unreadMessages
      });

    } catch (error) {
      console.error('❌ [CHANNEL_STATS] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      loadStats();
    }
  }, [channels, user?.role]);

  return { stats, loading, refetch: loadStats };
};

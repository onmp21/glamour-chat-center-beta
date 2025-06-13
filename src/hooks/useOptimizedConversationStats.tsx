
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ConversationCountService } from '@/services/ConversationCountService';

interface OptimizedConversationStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  unreadMessages: number;
}

export const useOptimizedConversationStats = () => {
  const [stats, setStats] = useState<OptimizedConversationStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  const loadOptimizedStats = async () => {
    try {
      setLoading(true);
      console.log('🚀 [OPTIMIZED_STATS] Starting optimized stats calculation');
      
      const accessibleChannels = getAccessibleChannels();
      const channelMapping = {
        'Yelena-AI': 'chat',
        'Canarana': 'canarana',
        'Souto Soares': 'souto-soares',
        'João Dourado': 'joao-dourado',
        'América Dourada': 'america-dourada',
        'Gustavo Gerente das Lojas': 'gerente-lojas',
        'Andressa Gerente Externo': 'gerente-externo'
      };

      let totalConversations = 0;
      let totalUnreadMessages = 0;

      // Processar canais sequencialmente para evitar sobrecarga
      for (const channel of channels) {
        if (!channel.isActive) continue;

        const channelId = channelMapping[channel.name as keyof typeof channelMapping];
        if (!channelId || !accessibleChannels.includes(channelId)) continue;

        try {
          console.log(`📊 [OPTIMIZED_STATS] Processing ${channel.name} -> ${channelId}`);
          
          // Usar serviços otimizados
          const [conversationCount, unreadCount] = await Promise.all([
            ConversationCountService.getConversationCount(channelId),
            ConversationCountService.getUnreadCount(channelId)
          ]);

          totalConversations += conversationCount;
          totalUnreadMessages += unreadCount;

          console.log(`✅ [OPTIMIZED_STATS] ${channelId}: ${conversationCount} conversations, ${unreadCount} unread`);
          
          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ [OPTIMIZED_STATS] Error for ${channelId}:`, error);
        }
      }

      const optimizedStats = {
        total: totalConversations,
        pending: totalUnreadMessages, // Simplificado: assumimos que não lidas = pendentes
        inProgress: 0, // Por enquanto, vamos focar na otimização
        resolved: totalConversations - totalUnreadMessages,
        unreadMessages: totalUnreadMessages
      };

      console.log('📊 [OPTIMIZED_STATS] Final optimized stats:', optimizedStats);
      setStats(optimizedStats);

    } catch (error) {
      console.error('❌ [OPTIMIZED_STATS] Error loading optimized stats:', error);
      setStats({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        unreadMessages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      loadOptimizedStats();
      
      // Refresh a cada 2 minutos (mais conservador)
      const interval = setInterval(loadOptimizedStats, 120000);
      return () => clearInterval(interval);
    }
  }, [channels]);

  return {
    stats,
    loading,
    refreshStats: loadOptimizedStats
  };
};

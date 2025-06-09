
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';
import { useExams } from '@/hooks/useExams';

interface ConversationStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

interface ExamStats {
  totalExams: number;
  examsThisMonth: number;
  examsThisWeek: number;
}

interface Channel {
  id: string;
  name: string;
  conversationCount: number;
}

export const useDashboardStats = () => {
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const { exams } = useExams();
  
  const [conversationStats, setConversationStats] = useState<ConversationStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  const [availableChannels, setAvailableChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // Mapear canais do banco para IDs legados para compatibilidade (Pedro removido)
  const getChannelLegacyId = (channel: any) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gerente das Lojas': 'gerente-lojas',
      'Gerente do Externo': 'gerente-externo'
    };
    return nameToId[channel.name] || channel.id;
  };

  // Calcular estatísticas de exames
  const examStats: ExamStats = {
    totalExams: exams.length,
    examsThisMonth: exams.filter(exam => {
      const examDate = new Date(exam.appointmentDate);
      const now = new Date();
      return examDate.getMonth() === now.getMonth() && 
             examDate.getFullYear() === now.getFullYear();
    }).length,
    examsThisWeek: exams.filter(exam => {
      const examDate = new Date(exam.appointmentDate);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return examDate >= weekAgo && examDate <= now;
    }).length
  };

  // Processar canais disponíveis
  useEffect(() => {
    const processChannels = async () => {
      try {
        setLoading(true);
        
        const accessibleChannels = getAccessibleChannels();
        const channelsWithStats: Channel[] = [];
        
        for (const channel of channels.filter(c => c.isActive && c.name !== 'Pedro')) {
          const legacyId = getChannelLegacyId(channel);
          
          if (accessibleChannels.includes(legacyId)) {
            channelsWithStats.push({
              id: legacyId,
              name: channel.name,
              conversationCount: 0 // Será atualizado pelos hooks de conversas
            });
          }
        }
        
        setAvailableChannels(channelsWithStats);
        
        console.log('📊 [DASHBOARD_STATS] Processed channels:', channelsWithStats);
      } catch (error) {
        console.error('❌ [DASHBOARD_STATS] Error processing channels:', error);
      } finally {
        setLoading(false);
      }
    };

    if (channels.length > 0) {
      processChannels();
    }
  }, [channels]);

  // Hook para estatísticas de conversas agregadas
  const ChannelStatsAggregator = () => {
    const channelHooks = availableChannels.map(channel => {
      // Usar o ID real do banco para buscar conversas
      const realChannelId = channels.find(c => getChannelLegacyId(c) === channel.id)?.id;
      return useChannelConversationsRefactored(realChannelId || channel.id);
    });

    useEffect(() => {
      if (channelHooks.every(hook => !hook.loading)) {
        let totalConversations = 0;
        let pendingCount = 0;
        let inProgressCount = 0;
        let resolvedCount = 0;
        
        const updatedChannels = availableChannels.map((channel, index) => {
          const conversations = channelHooks[index]?.conversations || [];
          totalConversations += conversations.length;
          
          conversations.forEach(conv => {
            if (conv.status === 'unread') pendingCount++;
            else if (conv.status === 'in_progress') inProgressCount++;
            else if (conv.status === 'resolved') resolvedCount++;
          });
          
          return {
            ...channel,
            conversationCount: conversations.length
          };
        });
        
        setAvailableChannels(updatedChannels);
        setConversationStats({
          total: totalConversations,
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount
        });
        
        console.log('📊 [DASHBOARD_STATS] Updated conversation stats:', {
          total: totalConversations,
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount
        });
      }
    }, [channelHooks.map(hook => hook.loading).join(','), channelHooks.map(hook => hook.conversations.length).join(',')]);

    return null;
  };

  return {
    conversationStats,
    examStats,
    availableChannels,
    loading,
    ChannelStatsAggregator
  };
};

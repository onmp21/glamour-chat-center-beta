
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ChannelService } from '@/services/ChannelService';
import { ConversationGrouper } from '@/utils/ConversationGrouper';

interface RecentActivity {
  id: string;
  type: 'new_message' | 'status_change' | 'new_conversation';
  title: string;
  description: string;
  time: string;
  channelName: string;
  contactName: string;
}

export const useRecentActivities = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      
      const accessibleChannels = getAccessibleChannels();
      const channelMapping = {
        'Yelena-AI': 'chat',
        'Canarana': 'canarana',
        'Souto Soares': 'souto-soares',
        'João Dourado': 'joao-dourado',
        'América Dourada': 'america-dourada',
        'Gerente das Lojas': 'gerente-lojas',
        'Gerente do Externo': 'gerente-externo'
      };

      const allActivities: RecentActivity[] = [];

      for (const channel of channels.filter(c => c.isActive)) {
        const channelId = channelMapping[channel.name as keyof typeof channelMapping];
        if (!channelId || !accessibleChannels.includes(channelId)) continue;

        try {
          const channelService = new ChannelService(channelId);
          const rawMessages = await channelService.fetchMessages();
          
          if (rawMessages.length > 0) {
            const conversations = ConversationGrouper.groupMessagesByPhone(rawMessages, channelId);
            
            conversations.forEach(conversation => {
              const lastMessageTime = new Date(conversation.last_message_time || 0);
              const now = new Date();
              const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
              
              // Apenas atividades das últimas 24 horas
              if (hoursDiff <= 24) {
                let timeText = '';
                if (hoursDiff < 1) {
                  timeText = `${Math.floor(hoursDiff * 60)}min`;
                } else if (hoursDiff < 24) {
                  timeText = `${Math.floor(hoursDiff)}h`;
                } else {
                  timeText = `${Math.floor(hoursDiff / 24)}d`;
                }

                allActivities.push({
                  id: `${channelId}-${conversation.contact_phone}-${lastMessageTime.getTime()}`,
                  type: 'new_message',
                  title: 'Nova mensagem',
                  description: `${conversation.contact_name} enviou uma mensagem`,
                  time: timeText,
                  channelName: channel.name,
                  contactName: conversation.contact_name
                });
              }
            });
          }
        } catch (error) {
          console.error(`Erro ao carregar atividades do canal ${channelId}:`, error);
        }
      }

      // Ordenar por tempo e pegar apenas as 10 mais recentes
      const sortedActivities = allActivities
        .sort((a, b) => {
          const timeA = parseInt(a.time);
          const timeB = parseInt(b.time);
          return timeA - timeB;
        })
        .slice(0, 10);

      setActivities(sortedActivities);

    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      loadRecentActivities();
      
      // Auto refresh a cada 2 minutos
      const interval = setInterval(loadRecentActivities, 120000);
      return () => clearInterval(interval);
    }
  }, [channels]);

  return {
    activities,
    loading,
    refreshActivities: loadRecentActivities
  };
};

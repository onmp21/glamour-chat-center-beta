
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { MessageService } from '@/services/MessageService';

interface RecentActivity {
  id: string;
  type: 'new_message' | 'status_change' | 'new_conversation';
  title: string;
  description: string;
  lastMessage: string;
  time: string;
  channelName: string;
  contactName: string;
}

export const useRecentActivities = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { channels } = useChannels();

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      console.log('🔄 [RECENT_ACTIVITIES] Loading recent activities from all channels...');
      
      const channelMapping = {
        'Yelena-AI': 'chat',
        'Canarana': 'canarana',
        'Souto Soares': 'souto-soares',
        'João Dourado': 'joao-dourado',
        'América Dourada': 'america-dourada',
        'Gustavo Gerente das Lojas': 'gerente-lojas',
        'Andressa Gerente Externo': 'gerente-externo'
      };

      const allActivities: RecentActivity[] = [];

      // Processar todos os canais ativos
      for (const channel of channels.filter(c => c.isActive)) {
        const channelId = channelMapping[channel.name as keyof typeof channelMapping];
        if (!channelId) continue;

        try {
          console.log(`📋 [RECENT_ACTIVITIES] Processing channel: ${channel.name} -> ${channelId}`);
          
          const messageService = new MessageService(channelId);
          const conversations = await messageService.getConversations(10); // Buscar apenas 10 conversas mais recentes por canal
          
          conversations.forEach(conversation => {
            if (!conversation.last_message_time) return;
            
            const lastMessageTime = new Date(conversation.last_message_time);
            const now = new Date();
            const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
            
            // Apenas atividades das últimas 48 horas
            if (hoursDiff <= 48) {
              let timeText = '';
              if (hoursDiff < 1) {
                const minutes = Math.floor(hoursDiff * 60);
                timeText = minutes <= 0 ? 'agora' : `${minutes}min`;
              } else if (hoursDiff < 24) {
                timeText = `${Math.floor(hoursDiff)}h`;
              } else {
                timeText = `${Math.floor(hoursDiff / 24)}d`;
              }

              // Truncar mensagem para não ficar muito longa
              const truncatedMessage = conversation.last_message && conversation.last_message.length > 50 
                ? conversation.last_message.substring(0, 50) + '...'
                : conversation.last_message || 'Sem mensagem';

              allActivities.push({
                id: `${channelId}-${conversation.contact_phone}-${lastMessageTime.getTime()}`,
                type: 'new_message',
                title: conversation.contact_name || `Cliente ${conversation.contact_phone.slice(-4)}`,
                description: `${channel.name}`,
                lastMessage: truncatedMessage,
                time: timeText,
                channelName: channel.name,
                contactName: conversation.contact_name || `Cliente ${conversation.contact_phone.slice(-4)}`
              });
            }
          });
          
          console.log(`✅ [RECENT_ACTIVITIES] Channel ${channelId}: found ${conversations.length} recent conversations`);
          
        } catch (error) {
          console.error(`❌ [RECENT_ACTIVITIES] Error loading activities from channel ${channelId}:`, error);
        }
      }

      // Ordenar por tempo (mais recente primeiro) e pegar apenas 7 atividades
      const sortedActivities = allActivities
        .sort((a, b) => {
          // Converter tempo para número para ordenação correta
          const getTimeValue = (timeStr: string) => {
            if (timeStr === 'agora') return 0;
            const num = parseInt(timeStr);
            if (timeStr.includes('min')) return num;
            if (timeStr.includes('h')) return num * 60;
            if (timeStr.includes('d')) return num * 60 * 24;
            return 999999;
          };
          
          return getTimeValue(a.time) - getTimeValue(b.time);
        })
        .slice(0, 7); // Limitar a 7 linhas conforme solicitado

      console.log(`🎯 [RECENT_ACTIVITIES] Final result: ${sortedActivities.length} activities from ${channels.length} channels`);
      setActivities(sortedActivities);

    } catch (error) {
      console.error('❌ [RECENT_ACTIVITIES] Error loading recent activities:', error);
      setActivities([]);
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

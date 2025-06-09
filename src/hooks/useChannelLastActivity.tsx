
import { useState, useEffect } from 'react';
import { MessageService } from '@/services/MessageService';

export const useChannelLastActivity = (channelId: string) => {
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLastActivity = async () => {
      if (!channelId) {
        setLastActivity(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`🕐 [CHANNEL_ACTIVITY] Loading last activity for channel: ${channelId}`);
        
        const messageService = new MessageService(channelId);
        const conversations = await messageService.getConversations();
        
        // Encontrar a conversa com a mensagem mais recente
        let mostRecentActivity: string | null = null;
        
        conversations.forEach(conversation => {
          if (conversation.last_message_time) {
            if (!mostRecentActivity || new Date(conversation.last_message_time) > new Date(mostRecentActivity)) {
              mostRecentActivity = conversation.last_message_time;
            }
          }
        });
        
        console.log(`🕐 [CHANNEL_ACTIVITY] Channel ${channelId} last activity: ${mostRecentActivity}`);
        setLastActivity(mostRecentActivity);
      } catch (error) {
        console.error(`❌ [CHANNEL_ACTIVITY] Error loading last activity for channel ${channelId}:`, error);
        setLastActivity(null);
      } finally {
        setLoading(false);
      }
    };

    loadLastActivity();
  }, [channelId]);

  const formatLastActivity = (): string => {
    if (!lastActivity) return 'Sem atividade recente';
    
    try {
      const now = new Date();
      const lastActivityDate = new Date(lastActivity);
      const diffInMinutes = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Agora mesmo';
      if (diffInMinutes === 1) return '1 minuto atrás';
      if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours === 1) return '1 hora atrás';
      if (diffInHours < 24) return `${diffInHours} horas atrás`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return '1 dia atrás';
      return `${diffInDays} dias atrás`;
    } catch (error) {
      return 'Sem atividade recente';
    }
  };

  return {
    lastActivity,
    lastActivityText: formatLastActivity(),
    loading
  };
};


import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced';
import { MessageService } from '@/services/MessageService';

interface RealConversationStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  unreadMessages: number;
}

interface ConversationData {
  id: string;
  phone: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  channel: string;
  status: 'unread' | 'in_progress' | 'resolved';
}

export const useRealConversationStats = () => {
  const [stats, setStats] = useState<RealConversationStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const { getConversationStatus } = useConversationStatusEnhanced();

  const loadRealStats = async () => {
    try {
      setLoading(true);
      console.log('🔍 [REAL_STATS] Starting conversation statistics calculation');
      
      const accessibleChannels = getAccessibleChannels();
      console.log('🔐 [REAL_STATS] Accessible channels:', accessibleChannels);
      
      const channelMapping = {
        'Yelena-AI': 'chat',
        'Canarana': 'canarana',
        'Souto Soares': 'souto-soares',
        'João Dourado': 'joao-dourado',
        'América Dourada': 'america-dourada',
        'Gustavo Gerente das Lojas': 'gerente-lojas',
        'Andressa Gerente Externo': 'gerente-externo'
      };

      // Array para armazenar todas as conversas de todos os canais
      const allConversations: ConversationData[] = [];
      let mostRecentActivity: string | null = null;

      console.log('🔄 [REAL_STATS] Processing channels...');

      // Buscar dados de todos os canais ativos
      for (const channel of channels.filter(c => c.isActive)) {
        const channelId = channelMapping[channel.name as keyof typeof channelMapping];
        
        console.log(`📊 [REAL_STATS] Processing channel: ${channel.name} -> ${channelId}`);
        
        if (!channelId) {
          console.log(`⚠️ [REAL_STATS] Channel ${channel.name} not found in mapping, skipping`);
          continue;
        }
        
        if (!accessibleChannels.includes(channelId)) {
          console.log(`🔒 [REAL_STATS] Channel ${channelId} not accessible, skipping`);
          continue;
        }

        try {
          const messageService = new MessageService(channelId);
          const conversations = await messageService.getConversations();
          
          console.log(`📈 [REAL_STATS] Channel ${channelId}: found ${conversations.length} conversations`);
          
          // Processar conversas do canal atual
          conversations.forEach(conversation => {
            const phone = conversation.contact_phone;
            console.log(`📞 [REAL_STATS] Processing conversation: ${phone} - ${conversation.contact_name} in channel ${channelId}`);
            
            const status = getConversationStatus(channelId, conversation.id);
            
            // Criar um ID único para cada conversa em cada canal
            const uniqueConversationId = `${channelId}-${conversation.id}`;
            
            // Atualizar última atividade mais recente
            if (conversation.last_message_time) {
              if (!mostRecentActivity || new Date(conversation.last_message_time) > new Date(mostRecentActivity)) {
                mostRecentActivity = conversation.last_message_time;
              }
            }
            
            allConversations.push({
              id: uniqueConversationId,
              phone,
              name: conversation.contact_name || `Cliente ${phone.slice(-4)}`,
              lastMessage: conversation.last_message || 'Sem mensagem',
              lastMessageTime: conversation.last_message_time || '',
              channel: channelId,
              status
            });
            
            console.log(`✅ [REAL_STATS] Added conversation: ${uniqueConversationId} for ${phone} in ${channelId}`);
          });

        } catch (error) {
          console.error(`❌ [REAL_STATS] Error loading stats for channel ${channelId}:`, error);
        }
      }

      // Calcular estatísticas finais baseadas em todas as conversas
      let pendingCount = 0;
      let inProgressCount = 0;
      let resolvedCount = 0;
      let unreadMessages = 0;

      allConversations.forEach((conv) => {
        console.log(`📊 [REAL_STATS] Final processing for ${conv.id}: phone=${conv.phone}, status=${conv.status}, channel=${conv.channel}`);
        
        switch (conv.status) {
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
            // Se não tem status definido, considerar como pendente
            pendingCount++;
            break;
        }

        // Contar mensagens não lidas baseado no status e tempo
        if (conv.status !== 'resolved') {
          const lastMessageTime = new Date(conv.lastMessageTime || 0);
          const now = new Date();
          const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            unreadMessages++;
          }
        }
      });

      const totalConversations = allConversations.length;

      console.log('📊 [REAL_STATS] Final count summary:');
      console.log(`  🔢 Total conversations across all channels: ${totalConversations}`);
      console.log(`  📋 All conversations:`, allConversations.map(conv => `${conv.id} (${conv.phone} in ${conv.channel})`));
      console.log(`  🏷️ Conversations by channel:`, 
        allConversations.reduce((acc, conv) => {
          acc[conv.channel] = (acc[conv.channel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      console.log(`  ⏳ Pending: ${pendingCount}`);
      console.log(`  🔄 In Progress: ${inProgressCount}`);
      console.log(`  ✅ Resolved: ${resolvedCount}`);
      console.log(`  📬 Unread Messages: ${unreadMessages}`);
      console.log(`  🕐 Most recent activity: ${mostRecentActivity}`);

      const finalStats = {
        total: totalConversations,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        unreadMessages
      };

      console.log('📊 [REAL_STATS] Final statistics:', finalStats);
      setStats(finalStats);
      setLastActivity(mostRecentActivity);

    } catch (error) {
      console.error('❌ [REAL_STATS] Error loading real conversation statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      loadRealStats();
      
      // Auto refresh a cada 2 minutos
      const interval = setInterval(loadRealStats, 120000);
      return () => clearInterval(interval);
    }
  }, [channels]);

  return {
    stats,
    loading,
    lastActivity,
    refreshStats: loadRealStats
  };
};

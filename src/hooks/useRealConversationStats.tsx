
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
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
  const { getConversationStatus } = useConversationStatusEnhanced();

  const loadGlobalStats = async () => {
    try {
      setLoading(true);
      console.log('🌍 [GLOBAL_STATS] Starting global conversation statistics calculation');
      
      // Mapear TODOS os canais (sem filtro de permissão para estatísticas globais)
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

      console.log('🔄 [GLOBAL_STATS] Processing ALL channels for global statistics...');

      // Processar todos os canais ativos (sem restrição de permissão)
      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        if (!channel.isActive) {
          console.log(`⏭️ [GLOBAL_STATS] Skipping inactive channel: ${channel.name}`);
          continue;
        }

        const channelId = channelMapping[channel.name as keyof typeof channelMapping];
        
        console.log(`📊 [GLOBAL_STATS] Processing channel ${i + 1}/${channels.length}: ${channel.name} -> ${channelId}`);
        
        if (!channelId) {
          console.log(`⚠️ [GLOBAL_STATS] Channel ${channel.name} not found in mapping, skipping`);
          continue;
        }

        try {
          const messageService = new MessageService(channelId);
          
          // Usar limite menor para conversas para evitar timeouts
          const conversations = await messageService.getConversations(20);
          
          console.log(`📈 [GLOBAL_STATS] Channel ${channelId}: found ${conversations.length} conversations`);
          
          // Processar conversas do canal atual
          conversations.forEach(conversation => {
            const phone = conversation.contact_phone;
            console.log(`📞 [GLOBAL_STATS] Processing conversation: ${phone} - ${conversation.contact_name} in channel ${channelId}`);
            
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
            
            console.log(`✅ [GLOBAL_STATS] Added conversation: ${uniqueConversationId} for ${phone} in ${channelId}`);
          });

          // Delay entre canais para não sobrecarregar o banco
          if (i < channels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }

        } catch (error) {
          console.error(`❌ [GLOBAL_STATS] Error loading stats for channel ${channelId}:`, error);
          // Continue with other channels instead of failing completely
        }
      }

      // Calcular estatísticas finais baseadas em todas as conversas de todos os canais
      let pendingCount = 0;
      let inProgressCount = 0;
      let resolvedCount = 0;
      let unreadMessages = 0;

      allConversations.forEach((conv) => {
        console.log(`📊 [GLOBAL_STATS] Final processing for ${conv.id}: phone=${conv.phone}, status=${conv.status}, channel=${conv.channel}`);
        
        switch (conv.status) {
          case 'unread':
            pendingCount++;
            unreadMessages++;
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
            unreadMessages++;
            break;
        }
      });

      const totalConversations = allConversations.length;

      console.log('🌍 [GLOBAL_STATS] Global count summary:');
      console.log(`  🔢 Total conversations across ALL channels: ${totalConversations}`);
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

      console.log('🌍 [GLOBAL_STATS] Final global statistics:', finalStats);
      setStats(finalStats);
      setLastActivity(mostRecentActivity);

    } catch (error) {
      console.error('❌ [GLOBAL_STATS] Error loading global conversation statistics:', error);
      // Set default stats on error to prevent UI issues
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
      loadGlobalStats();
      
      // Auto refresh a cada 5 minutos para estatísticas globais
      const interval = setInterval(loadGlobalStats, 300000);
      return () => clearInterval(interval);
    }
  }, [channels]);

  return {
    stats,
    loading,
    lastActivity,
    refreshStats: loadGlobalStats
  };
};

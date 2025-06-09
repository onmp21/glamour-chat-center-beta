
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { useChannelConversations } from './useChannelConversations';
import { getTableNameForChannel } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';
import { ConversationGrouper } from '@/utils/ConversationGrouper';

export interface ConversationStats {
  totalConversations: number;
  unreadConversations: number;
  inProgressConversations: number;
  resolvedConversations: number;
}

export const useConversationStats = () => {
  const [stats, setStats] = useState<ConversationStats>({
    totalConversations: 0,
    unreadConversations: 0,
    inProgressConversations: 0,
    resolvedConversations: 0
  });
  const [loading, setLoading] = useState(true);
  const { channels } = useChannels();

  const loadAllConversations = async () => {
    try {
      setLoading(true);
      console.log('Carregando estatísticas de todas as conversas...');

      const allConversations = [];
      
      // Mapear nomes de canais para IDs de tabela
      const channelMapping = {
        'Yelena-AI': 'chat',
        'Canarana': 'canarana',
        'Souto Soares': 'souto-soares',
        'João Dourado': 'joao-dourado',
        'América Dourada': 'america-dourada',
        'Gerente das Lojas': 'gerente-lojas',
        'Gerente do Externo': 'gerente-externo',
        'Pedro': 'pedro'
      };

      for (const channel of channels) {
        if (!channel.isActive) continue;
        
        const channelId = channelMapping[channel.name as keyof typeof channelMapping];
        if (!channelId) continue;

        try {
          const tableName = getTableNameForChannel(channelId);
          console.log(`Carregando dados da tabela: ${tableName}`);
          
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('id', { ascending: false });

          if (error) {
            console.error(`Erro ao carregar dados de ${tableName}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            const conversations = ConversationGrouper.groupMessagesByPhone(data, channelId);
            allConversations.push(...conversations);
          }
        } catch (error) {
          console.error(`Erro ao processar canal ${channelId}:`, error);
        }
      }

      console.log('Total de conversas carregadas:', allConversations.length);

      // Calcular estatísticas reais
      const totalConversations = allConversations.length;
      
      // Para demonstração, vamos simular alguns status
      // Em uma implementação real, estes status viriam do banco de dados
      const unreadConversations = Math.floor(totalConversations * 0.3); // 30% não lidas
      const inProgressConversations = Math.floor(totalConversations * 0.4); // 40% em andamento
      const resolvedConversations = totalConversations - unreadConversations - inProgressConversations;

      setStats({
        totalConversations,
        unreadConversations,
        inProgressConversations,
        resolvedConversations
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas de conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllConversations();

    // Auto refresh a cada minuto
    const interval = setInterval(() => {
      console.log('Auto refresh - carregando estatísticas...');
      loadAllConversations();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [channels]);

  return {
    stats,
    loading,
    refreshStats: loadAllConversations
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversationCounts {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export const useChannelConversationCounts = (channelId: string) => {
  const [counts, setCounts] = useState<ConversationCounts>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);

  // Mapear channelId para nome da tabela
  const getTableNameForChannel = (channelId: string): string => {
    const channelMapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };
    
    return channelMapping[channelId] || 'yelena_ai_conversas';
  };

  const loadConversationCounts = async () => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tableName = getTableNameForChannel(channelId);
      
      console.log(`📊 [CONVERSATION_COUNTS] Loading counts for ${channelId} from table ${tableName}`);

      // Usar rpc para contagem de conversas únicas
      const { data: totalData, error: totalError } = await supabase.rpc('count_unique_sessions', {
        table_name: tableName
      });

      if (totalError) {
        console.error(`❌ [CONVERSATION_COUNTS] Error counting total conversations:`, totalError);
        setCounts({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
        return;
      }

      const totalCount = totalData || 0;

      // Contar mensagens não lidas (pendentes)
      const { data: unreadData, error: unreadError } = await supabase.rpc('count_unread_messages_total', {
        table_name: tableName
      });

      const pendingCount = unreadError ? 0 : (unreadData || 0);

      console.log(`✅ [CONVERSATION_COUNTS] ${channelId}: ${totalCount} conversations, ${pendingCount} unread messages`);

      setCounts({
        total: totalCount,
        pending: pendingCount,
        inProgress: 0,
        resolved: Math.max(0, totalCount - pendingCount)
      });

    } catch (error) {
      console.error(`❌ [CONVERSATION_COUNTS] Error loading counts for ${channelId}:`, error);
      setCounts({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversationCounts();
  }, [channelId]);

  return { counts, loading };
};

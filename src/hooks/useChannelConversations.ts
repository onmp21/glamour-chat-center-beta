
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChannelConversation } from '@/types/messages';

export function useChannelConversations(channelId: string) {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapear canais para tabelas do banco de dados
  const getTableNameForChannel = useCallback((channelId: string): string => {
    const channelTableMapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas',
      // Mapeamento por UUID também
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    };
    
    return channelTableMapping[channelId] || 'yelena_ai_conversas';
  }, []);

  const loadConversations = useCallback(async () => {
    if (!channelId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tableName = getTableNameForChannel(channelId);
      console.log(`📋 [CONVERSATIONS] Carregando conversas da tabela: ${tableName} para canal: ${channelId}`);

      // Buscar conversas únicas por session_id com informações agregadas
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error(`❌ [CONVERSATIONS] Erro ao carregar conversas:`, error);
        throw error;
      }

      // Agrupar por session_id e processar
      const conversationMap = new Map<string, ChannelConversation>();
      
      data?.forEach((message: any) => {
        const sessionId = message.session_id;
        const contactName = message.nome_do_contato || message.Nome_do_contato || 'Contato Anônimo';
        
        if (!conversationMap.has(sessionId)) {
          conversationMap.set(sessionId, {
            id: sessionId,
            contact_name: contactName,
            contact_phone: sessionId,
            last_message: message.message || '[Mídia]',
            last_message_time: message.read_at || new Date().toISOString(),
            status: message.is_read ? 'resolved' : 'unread',
            updated_at: message.read_at || new Date().toISOString(),
            unread_count: message.is_read ? 0 : 1
          });
        } else {
          // Atualizar com mensagem mais recente
          const existing = conversationMap.get(sessionId)!;
          if (new Date(message.read_at || 0) > new Date(existing.last_message_time || 0)) {
            existing.last_message = message.message || '[Mídia]';
            existing.last_message_time = message.read_at;
            existing.updated_at = message.read_at;
          }
          
          // Contar mensagens não lidas
          if (!message.is_read) {
            existing.unread_count = (existing.unread_count || 0) + 1;
            existing.status = 'unread';
          }
        }
      });

      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      console.log(`✅ [CONVERSATIONS] ${conversationsList.length} conversas carregadas para ${channelId}`);
      setConversations(conversationsList);

    } catch (err) {
      console.error('❌ [CONVERSATIONS] Erro ao carregar conversas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, getTableNameForChannel]);

  const updateConversationStatus = useCallback(async (conversationId: string, status: 'unread' | 'in_progress' | 'resolved') => {
    try {
      const tableName = getTableNameForChannel(channelId);
      
      // Marcar mensagens como lidas se status for 'resolved'
      if (status === 'resolved') {
        const { error } = await supabase.rpc('mark_messages_as_read', {
          table_name: tableName,
          p_session_id: conversationId
        });

        if (error) {
          console.error('❌ [CONVERSATIONS] Erro ao marcar mensagens como lidas:', error);
          return;
        }
      }

      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status, unread_count: status === 'resolved' ? 0 : conv.unread_count }
            : conv
        )
      );

      console.log(`✅ [CONVERSATIONS] Status atualizado para ${conversationId}: ${status}`);
    } catch (error) {
      console.error('❌ [CONVERSATIONS] Erro ao atualizar status:', error);
    }
  }, [channelId, getTableNameForChannel]);

  // Carregar conversas quando o canal mudar
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Configurar realtime para atualizações
  useEffect(() => {
    if (!channelId) return;

    const tableName = getTableNameForChannel(channelId);
    
    const channel = supabase
      .channel(`conversations-${channelId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: tableName 
        }, 
        (payload) => {
          console.log(`🔄 [CONVERSATIONS] Mudança detectada na tabela ${tableName}:`, payload);
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, getTableNameForChannel, loadConversations]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    updateConversationStatus
  };
}

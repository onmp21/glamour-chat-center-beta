
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
}

export const useSimpleConversations = (channelId: string | null) => {
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const getTableName = (channelId: string): string => {
    console.log(`🔍 [SIMPLE_CONVERSATIONS] Mapeando canal: ${channelId}`);
    
    const mapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    };
    
    const tableName = mapping[channelId] || 'yelena_ai_conversas';
    console.log(`✅ [SIMPLE_CONVERSATIONS] Canal: ${channelId} -> Tabela: ${tableName}`);
    return tableName;
  };

  const extractPhoneFromSession = (sessionId: string): string => {
    const match = sessionId.match(/(\d+)/);
    return match ? match[1] : sessionId;
  };

  const loadConversations = async () => {
    if (!channelId) {
      console.log('⚠️ [SIMPLE_CONVERSATIONS] Nenhum canal fornecido');
      setConversations([]);
      return;
    }

    if (!isAuthenticated) {
      console.log('⚠️ [SIMPLE_CONVERSATIONS] Usuário não autenticado');
      setConversations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tableName = getTableName(channelId);
      console.log(`📋 [SIMPLE_CONVERSATIONS] Iniciando query na tabela: ${tableName}, usuário: ${user?.name}`);

      const { data: rawData, error: queryError } = await supabase
        .from(tableName as any)
        .select('session_id, nome_do_contato, message, read_at, tipo_remetente')
        .order('read_at', { ascending: false })
        .limit(200);

      if (queryError) {
        console.error('❌ [SIMPLE_CONVERSATIONS] Erro na query:', queryError);
        setError(queryError.message);
        return;
      }

      console.log(`📋 [SIMPLE_CONVERSATIONS] Query executada. Registros recebidos:`, rawData?.length || 0);

      const conversationsMap = new Map<string, SimpleConversation>();
      
      (rawData || []).forEach((message: any) => {
        const sessionId = message.session_id;
        
        if (!conversationsMap.has(sessionId)) {
          let contactName = 'Cliente';
          if (message.nome_do_contato) {
            contactName = message.nome_do_contato;
          } else {
            contactName = extractPhoneFromSession(sessionId);
          }

          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: contactName,
            contact_phone: extractPhoneFromSession(sessionId),
            last_message: message.message || '',
            last_message_time: message.read_at || new Date().toISOString(),
            status: 'unread',
            unread_count: 0,
            updated_at: message.read_at || new Date().toISOString()
          });
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      console.log(`✅ [SIMPLE_CONVERSATIONS] ${conversations.length} conversas únicas processadas`);
      
      if (conversations.length > 0) {
        console.log(`📋 [SIMPLE_CONVERSATIONS] Primeira conversa:`, conversations[0]);
      }
      
      setConversations(conversations);

    } catch (err) {
      console.error('❌ [SIMPLE_CONVERSATIONS] Erro inesperado:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`🚀 [SIMPLE_CONVERSATIONS] Effect acionado:`, {
      channelId,
      isAuthenticated,
      user: user?.name
    });
    
    if (isAuthenticated && channelId) {
      loadConversations();
    } else {
      console.log('⏳ [SIMPLE_CONVERSATIONS] Aguardando parâmetros necessários...');
      setConversations([]);
      setError(null);
    }
  }, [channelId, isAuthenticated, user?.name]);

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations
  };
};

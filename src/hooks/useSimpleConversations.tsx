
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext';
import { ContactNameResolver } from '@/services/ContactNameResolver';

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

interface ConversationMessage {
  session_id: string;
  nome_do_contato: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
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

      const queryResult = await supabase
        .from(tableName as any)
        .select('session_id, nome_do_contato, message, read_at, tipo_remetente')
        .order('read_at', { ascending: false })
        .limit(200);

      if (queryResult.error) {
        console.error('❌ [SIMPLE_CONVERSATIONS] Erro na query:', queryResult.error);
        setError(queryResult.error.message);
        return;
      }

      const rawData = queryResult.data;
      console.log(`📋 [SIMPLE_CONVERSATIONS] Query executada. Registros recebidos:`, rawData?.length || 0);

      const conversationsMap = new Map<string, SimpleConversation>();
      
      if (rawData && Array.isArray(rawData)) {
        for (const message of rawData as unknown as ConversationMessage[]) {
          const sessionId = message.session_id;
          
          if (!conversationsMap.has(sessionId)) {
            const phoneNumber = extractPhoneFromSession(sessionId);
            
            const contactName = await ContactNameResolver.resolveName(
              phoneNumber, 
              message.nome_do_contato
            );

            conversationsMap.set(sessionId, {
              id: sessionId,
              contact_name: contactName,
              contact_phone: phoneNumber,
              last_message: message.message || '',
              last_message_time: message.read_at || new Date().toISOString(),
              status: 'unread' as const,
              unread_count: 0,
              updated_at: message.read_at || new Date().toISOString()
            });
          }
        }
      }

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      console.log(`✅ [SIMPLE_CONVERSATIONS] ${conversations.length} conversas únicas processadas com nomes resolvidos`);
      
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

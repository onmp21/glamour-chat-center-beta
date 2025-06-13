
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
  updated_at: string; // Adicionado campo obrigatório
}

export const useSimpleConversations = (channelId: string | null) => {
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const getTableName = (channelId: string): string => {
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
    return mapping[channelId] || 'yelena_ai_conversas';
  };

  const extractPhoneFromSession = (sessionId: string): string => {
    const match = sessionId.match(/(\d+)/);
    return match ? match[1] : sessionId;
  };

  const loadConversations = async () => {
    if (!channelId || !isAuthenticated) {
      console.log('🔍 [SIMPLE_CONVERSATIONS] Missing params:', { channelId, isAuthenticated });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tableName = getTableName(channelId);
      console.log(`📋 [SIMPLE_CONVERSATIONS] Loading from table: ${tableName}`);

      // Query corrigida - especificar campos explicitamente
      const { data: rawData, error: queryError } = await supabase
        .from(tableName as any)
        .select('session_id, Nome_do_contato, nome_do_contato, message, read_at, tipo_remetente')
        .order('read_at', { ascending: false })
        .limit(100);

      if (queryError) {
        console.error('❌ [SIMPLE_CONVERSATIONS] Query error:', queryError);
        setError(queryError.message);
        return;
      }

      console.log(`📋 [SIMPLE_CONVERSATIONS] Raw data received:`, rawData?.length || 0);

      // Processar dados e agrupar por session_id
      const conversationsMap = new Map<string, SimpleConversation>();
      
      (rawData || []).forEach((message: any) => {
        const sessionId = message.session_id;
        
        if (!conversationsMap.has(sessionId)) {
          // Determinar nome do contato
          let contactName = 'Cliente';
          if (message.Nome_do_contato) {
            contactName = message.Nome_do_contato;
          } else if (message.nome_do_contato) {
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
            updated_at: message.read_at || new Date().toISOString() // Campo obrigatório
          });
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      console.log(`✅ [SIMPLE_CONVERSATIONS] Loaded ${conversations.length} conversations`);
      setConversations(conversations);

    } catch (err) {
      console.error('❌ [SIMPLE_CONVERSATIONS] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && channelId) {
      console.log(`🚀 [SIMPLE_CONVERSATIONS] Effect triggered`);
      loadConversations();
    } else {
      console.log('⏳ [SIMPLE_CONVERSATIONS] Waiting for params...');
      setConversations([]);
    }
  }, [channelId, isAuthenticated]);

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations
  };
};

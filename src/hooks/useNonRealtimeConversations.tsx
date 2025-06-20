
import { useState, useEffect, useCallback } from 'react';
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

export const useNonRealtimeConversations = (channelId: string | null) => {
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const getTableName = (channelId: string): string => {
    const mapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    };
    
    const tableName = mapping[channelId] || 'yelena_ai_conversas';
    console.log(`🎯 [NON_REALTIME_CONVERSATIONS] Canal ${channelId} → Tabela ${tableName}`);
    return tableName;
  };

  const extractPhoneFromSession = (sessionId: string): string => {
    const match = sessionId.match(/(\d+)/);
    return match ? match[1] : sessionId;
  };

  const loadConversations = useCallback(async () => {
    if (!channelId || !isAuthenticated) {
      setConversations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tableName = getTableName(channelId);

      const queryResult = await supabase
        .from(tableName as any)
        .select('session_id, nome_do_contato, message, read_at, tipo_remetente')
        .order('read_at', { ascending: false })
        .limit(200);

      if (queryResult.error) {
        console.error('❌ [NON_REALTIME_CONVERSATIONS] Erro na query:', queryResult.error);
        setError(queryResult.error.message);
        return;
      }

      const rawData = queryResult.data;
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

      setConversations(conversations);

    } catch (err) {
      console.error('❌ [NON_REALTIME_CONVERSATIONS] Erro inesperado:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, isAuthenticated, user?.name]);

  useEffect(() => {
    if (isAuthenticated && channelId) {
      loadConversations();
    }
  }, [isAuthenticated, channelId, loadConversations]);

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations
  };
};

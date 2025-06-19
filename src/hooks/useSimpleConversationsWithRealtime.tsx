
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext';
import { ContactNameResolver } from '@/services/ContactNameResolver';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import GlobalRealtimeManager from '@/services/GlobalRealtimeManager';

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

export const useSimpleConversationsWithRealtime = (
  channelId: string | null,
  enableRealtime: boolean = true
) => {
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const subscriberIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const getTableName = (channelId: string): string => {
    console.log(`🔍 [SIMPLE_CONVERSATIONS_RT] Mapeando canal: ${channelId}`);
    
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
    console.log(`✅ [SIMPLE_CONVERSATIONS_RT] Canal: ${channelId} -> Tabela: ${tableName}`);
    return tableName;
  };

  const extractPhoneFromSession = (sessionId: string): string => {
    const match = sessionId.match(/(\d+)/);
    return match ? match[1] : sessionId;
  };

  const loadConversations = useCallback(async () => {
    if (!channelId) {
      console.log('⚠️ [SIMPLE_CONVERSATIONS_RT] Nenhum canal fornecido');
      setConversations([]);
      return;
    }

    if (!isAuthenticated) {
      console.log('⚠️ [SIMPLE_CONVERSATIONS_RT] Usuário não autenticado');
      setConversations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tableName = getTableName(channelId);
      console.log(`📋 [SIMPLE_CONVERSATIONS_RT] Iniciando query na tabela: ${tableName}, usuário: ${user?.name}`);

      const queryResult = await supabase
        .from(tableName as any)
        .select('session_id, nome_do_contato, message, read_at, tipo_remetente')
        .order('read_at', { ascending: false })
        .limit(200);

      if (queryResult.error) {
        console.error('❌ [SIMPLE_CONVERSATIONS_RT] Erro na query:', queryResult.error);
        setError(queryResult.error.message);
        return;
      }

      const rawData = queryResult.data;
      console.log(`📋 [SIMPLE_CONVERSATIONS_RT] Query executada. Registros recebidos:`, rawData?.length || 0);

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

      console.log(`✅ [SIMPLE_CONVERSATIONS_RT] ${conversations.length} conversas únicas processadas com nomes resolvidos`);
      
      if (mountedRef.current) {
        setConversations(conversations);
      }

    } catch (err) {
      console.error('❌ [SIMPLE_CONVERSATIONS_RT] Erro inesperado:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setConversations([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [channelId, isAuthenticated, user?.name]);

  // Setup realtime subscription
  useEffect(() => {
    mountedRef.current = true;
    
    if (!enableRealtime || !channelId || !isAuthenticated) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[SIMPLE_CONVERSATIONS_RT] No table mapping found for channel: ${channelId}`);
      return;
    }

    const realtimeCallback = (payload: any) => {
      if (!mountedRef.current) return;
      
      console.log(`🔴 [SIMPLE_CONVERSATIONS_RT] Nova mensagem via realtime:`, payload);
      
      // Refresh conversations after a short delay
      setTimeout(() => {
        if (mountedRef.current) {
          loadConversations();
        }
      }, 300);
    };

    const setupSubscription = async () => {
      try {
        const manager = GlobalRealtimeManager.getInstance();
        const subscriberId = await manager.subscribe(tableName, realtimeCallback);
        
        if (mountedRef.current) {
          subscriberIdRef.current = subscriberId;
          console.log(`✅ [SIMPLE_CONVERSATIONS_RT] Realtime subscription iniciado para o canal ${channelId} com ID ${subscriberId}`);
        }
      } catch (error) {
        console.error(`❌ [SIMPLE_CONVERSATIONS_RT] Erro ao criar subscription:`, error);
      }
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      
      if (subscriberIdRef.current) {
        console.log(`🔌 [SIMPLE_CONVERSATIONS_RT] Realtime subscription interrompido para o canal ${channelId}, subscriber ${subscriberIdRef.current}`);
        try {
          const manager = GlobalRealtimeManager.getInstance();
          manager.unsubscribe(tableName, subscriberIdRef.current);
        } catch (error) {
          console.error(`❌ [SIMPLE_CONVERSATIONS_RT] Erro ao fazer cleanup do realtime subscription:`, error);
        }
      }
    };
  }, [channelId, enableRealtime, isAuthenticated, loadConversations]);

  // Initial load
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

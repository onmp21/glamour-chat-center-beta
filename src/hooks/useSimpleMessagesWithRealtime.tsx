
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import GlobalRealtimeManager from '@/services/GlobalRealtimeManager';

interface SimpleMessage {
  id: string;
  message: string;
  nome_do_contato?: string;
  tipo_remetente?: string;
  read_at?: string;
  mensagemtype?: string;
  media_url?: string;
}

export const useSimpleMessagesWithRealtime = (
  channelId: string | null, 
  conversationId: string | null,
  enableRealtime: boolean = true
) => {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriberIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const loadMessages = useCallback(async () => {
    if (!channelId || !conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tableName = getTableNameForChannelSync(channelId);
      
      const { data, error: queryError } = await supabase
        .from(tableName as any)
        .select('id, message, nome_do_contato, tipo_remetente, read_at, mensagemtype, media_url')
        .eq('session_id', conversationId)
        .order('read_at', { ascending: true })
        .limit(50);

      if (queryError) {
        console.error('❌ [SIMPLE_MESSAGES_RT] Database error:', queryError);
        setError('Erro ao carregar mensagens');
        return;
      }

      const formattedMessages: SimpleMessage[] = (data || []).map((record: any) => ({
        id: record.id?.toString() || Math.random().toString(),
        message: record.message || '',
        nome_do_contato: record.nome_do_contato,
        tipo_remetente: record.tipo_remetente,
        read_at: record.read_at,
        mensagemtype: record.mensagemtype,
        media_url: record.media_url
      }));

      if (mountedRef.current) {
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('❌ [SIMPLE_MESSAGES_RT] Error:', err);
      if (mountedRef.current) {
        setError('Erro inesperado ao carregar mensagens');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [channelId, conversationId]);

  // Setup realtime subscription
  useEffect(() => {
    mountedRef.current = true;
    
    if (!enableRealtime || !channelId || !conversationId) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[SIMPLE_MESSAGES_RT] No table mapping found for channel: ${channelId}`);
      return;
    }

    const realtimeCallback = (payload: any) => {
      if (!mountedRef.current) return;
      
      console.log(`🔴 [SIMPLE_MESSAGES_RT] Nova mensagem via realtime:`, payload);
      
      // Check if the new message belongs to this conversation
      if (payload.new && payload.new.session_id === conversationId) {
        // Refresh messages after a short delay
        setTimeout(() => {
          if (mountedRef.current) {
            loadMessages();
          }
        }, 200);
      }
    };

    const setupSubscription = async () => {
      try {
        const manager = GlobalRealtimeManager.getInstance();
        const subscriberId = await manager.subscribe(tableName, realtimeCallback);
        
        if (mountedRef.current) {
          subscriberIdRef.current = subscriberId;
          console.log(`✅ [SIMPLE_MESSAGES_RT] Realtime subscription iniciado para mensagens ${channelId} com ID ${subscriberId}`);
        }
      } catch (error) {
        console.error(`❌ [SIMPLE_MESSAGES_RT] Erro ao criar subscription:`, error);
      }
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      
      if (subscriberIdRef.current) {
        console.log(`🔌 [SIMPLE_MESSAGES_RT] Realtime subscription interrompido para mensagens ${channelId}, subscriber ${subscriberIdRef.current}`);
        try {
          const manager = GlobalRealtimeManager.getInstance();
          manager.unsubscribe(tableName, subscriberIdRef.current);
        } catch (error) {
          console.error(`❌ [SIMPLE_MESSAGES_RT] Erro ao fazer cleanup do realtime subscription:`, error);
        }
      }
    };
  }, [channelId, conversationId, enableRealtime, loadMessages]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return { 
    messages, 
    loading, 
    error, 
    refreshMessages: loadMessages 
  };
};


import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import PollingManager from '@/services/PollingManager';

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
  const pollingIdRef = useRef<string | null>(null);
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

  // Setup polling
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

    const pollingCallback = () => {
      if (mountedRef.current) {
        console.log(`🔄 [SIMPLE_MESSAGES_RT] Polling update for messages ${channelId}/${conversationId}`);
        loadMessages();
      }
    };

    const setupPolling = () => {
      try {
        const manager = PollingManager.getInstance();
        const pollingKey = `${tableName}_messages_${conversationId}`;
        const pollingId = manager.startPolling(pollingKey, pollingCallback, 3000); // 3 segundos
        
        if (mountedRef.current) {
          pollingIdRef.current = pollingId;
          console.log(`✅ [SIMPLE_MESSAGES_RT] Polling iniciado para mensagens ${channelId} com ID ${pollingId}`);
        }
      } catch (error) {
        console.error(`❌ [SIMPLE_MESSAGES_RT] Erro ao criar polling:`, error);
      }
    };

    setupPolling();

    return () => {
      mountedRef.current = false;
      
      if (pollingIdRef.current) {
        console.log(`🔌 [SIMPLE_MESSAGES_RT] Polling interrompido para mensagens ${channelId}, poller ${pollingIdRef.current}`);
        try {
          const manager = PollingManager.getInstance();
          const pollingKey = `${getTableNameForChannelSync(channelId)}_messages_${conversationId}`;
          manager.stopPolling(pollingKey, pollingIdRef.current);
        } catch (error) {
          console.error(`❌ [SIMPLE_MESSAGES_RT] Erro ao fazer cleanup do polling:`, error);
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

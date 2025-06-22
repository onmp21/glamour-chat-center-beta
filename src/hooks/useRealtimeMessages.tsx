
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getTableNameForChannelSync } from '@/utils/channelMapping';

interface RealtimeMessage {
  id: string;
  message: string;
  nome_do_contato?: string;
  tipo_remetente?: string;
  read_at?: string;
  mensagemtype?: string;
  media_url?: string;
  session_id: string;
}

export const useRealtimeMessages = (
  channelId: string | null, 
  conversationId: string | null
) => {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
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
        .select('id, message, nome_do_contato, tipo_remetente, read_at, mensagemtype, media_url, session_id')
        .eq('session_id', conversationId)
        .order('read_at', { ascending: true })
        .limit(100);

      if (queryError) {
        console.error('❌ [REALTIME_MESSAGES] Database error:', queryError);
        setError('Erro ao carregar mensagens');
        return;
      }

      const formattedMessages: RealtimeMessage[] = (data || []).map((record: any) => ({
        id: record.id?.toString() || Math.random().toString(),
        message: record.message || '',
        nome_do_contato: record.nome_do_contato,
        tipo_remetente: record.tipo_remetente,
        read_at: record.read_at,
        mensagemtype: record.mensagemtype,
        media_url: record.media_url,
        session_id: record.session_id
      }));

      if (mountedRef.current) {
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('❌ [REALTIME_MESSAGES] Error:', err);
      if (mountedRef.current) {
        setError('Erro inesperado ao carregar mensagens');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [channelId, conversationId]);

  // Setup Supabase realtime subscription - Phase 2
  useEffect(() => {
    mountedRef.current = true;
    
    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!channelId || !conversationId) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[REALTIME_MESSAGES] No table mapping found for channel: ${channelId}`);
      return;
    }

    console.log(`✅ [REALTIME_MESSAGES] Setting up Supabase realtime for ${tableName} - conversation ${conversationId}`);

    // Create Supabase realtime channel
    const channel = supabase
      .channel(`messages_${tableName}_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `session_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔥 [REALTIME_MESSAGES] New message received:', payload.new);
          
          if (mountedRef.current) {
            const newMessage: RealtimeMessage = {
              id: payload.new.id?.toString() || Math.random().toString(),
              message: payload.new.message || '',
              nome_do_contato: payload.new.nome_do_contato,
              tipo_remetente: payload.new.tipo_remetente,
              read_at: payload.new.read_at,
              mensagemtype: payload.new.mensagemtype,
              media_url: payload.new.media_url,
              session_id: payload.new.session_id
            };
            
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `session_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔄 [REALTIME_MESSAGES] Message updated:', payload.new);
          
          if (mountedRef.current) {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id?.toString() 
                ? {
                    ...msg,
                    message: payload.new.message || msg.message,
                    read_at: payload.new.read_at || msg.read_at,
                    media_url: payload.new.media_url || msg.media_url
                  }
                : msg
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME_MESSAGES] Subscription status for ${tableName}:`, status);
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      
      if (channelRef.current) {
        console.log(`🔌 [REALTIME_MESSAGES] Cleaning up realtime subscription for ${tableName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelId, conversationId]);

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

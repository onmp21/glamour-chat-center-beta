
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CHANNEL_TABLE_MAPPING } from '@/utils/channelMapping';
import { getBrazilianTimestamp } from '@/utils/timestampUtils';

export interface InfiniteMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  tipo_remetente?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  read: boolean;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  media_url?: string;
}

// Type guard para verificar se um objeto tem read_at válido
const hasValidReadAt = (obj: any): obj is { read_at: string } => {
  return obj && 
         typeof obj === 'object' && 
         'read_at' in obj && 
         obj.read_at && 
         typeof obj.read_at === 'string';
};

export const useInfiniteMessages = (channelId: string | null, conversationId: string | null) => {
  const [messages, setMessages] = useState<InfiniteMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const oldestTimestampRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const realtimeChannelRef = useRef<any>(null);

  // Resetar quando mudar conversa
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      setHasMore(true);
      setError(null);
      oldestTimestampRef.current = null;
      loadInitialMessages();
    }
  }, [channelId, conversationId]);

  // Setup realtime subscription para mensagens individuais - melhorado
  useEffect(() => {
    if (!channelId || !conversationId) {
      return;
    }

    const tableName = CHANNEL_TABLE_MAPPING[channelId];
    if (!tableName) {
      return;
    }

    // Cleanup previous channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    console.log(`🔥 [INFINITE_MESSAGES] Setting up realtime for ${tableName} - conversation ${conversationId}`);

    // Create realtime channel
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
          console.log('🔥 [INFINITE_MESSAGES] New message received:', payload.new);
          
          if (mountedRef.current) {
            const newMessage = formatMessage(payload.new);
            setMessages(prev => {
              // Verificar se a mensagem já existe para evitar duplicatas
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                return prev;
              }
              return [...prev, newMessage];
            });
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
          console.log('🔄 [INFINITE_MESSAGES] Message updated:', payload.new);
          
          if (mountedRef.current) {
            const updatedMessage = formatMessage(payload.new);
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [INFINITE_MESSAGES] Realtime status for ${tableName}:`, status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        console.log(`🔌 [INFINITE_MESSAGES] Cleaning up realtime for ${tableName}`);
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [channelId, conversationId]);

  const loadInitialMessages = async () => {
    if (!channelId || !conversationId) return;

    const tableName = CHANNEL_TABLE_MAPPING[channelId];
    if (!tableName) return;

    setLoading(true);
    try {
      // Carregar mensagens iniciais - sem limitação de data
      const { data, error: fetchError } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', conversationId)
        .order('read_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('❌ [INFINITE_MESSAGES] Error loading initial messages:', fetchError);
        setError('Erro ao carregar mensagens');
        return;
      }

      if (data && data.length > 0) {
        const formattedMessages = data.reverse().map(formatMessage);
        setMessages(formattedMessages);
        
        // Usar type guard para verificação segura
        const firstMessage = data[0];
        if (hasValidReadAt(firstMessage)) {
          oldestTimestampRef.current = firstMessage.read_at;
        }
        
        // Se trouxe menos de 50, pode não ter mais mensagens antigas
        if (data.length < 50) {
          // Verificar se há mensagens mais antigas
          const { count } = await supabase
            .from(tableName as any)
            .select('id', { count: 'exact', head: true })
            .eq('session_id', conversationId)
            .lt('read_at', oldestTimestampRef.current || '');
          
          setHasMore((count || 0) > 0);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ [INFINITE_MESSAGES] Unexpected error:', error);
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = useCallback(async () => {
    if (!channelId || !conversationId || !hasMore || loading || !oldestTimestampRef.current) {
      return;
    }

    const tableName = CHANNEL_TABLE_MAPPING[channelId];
    if (!tableName) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', conversationId)
        .lt('read_at', oldestTimestampRef.current)
        .order('read_at', { ascending: false })
        .limit(30);

      if (fetchError) {
        console.error('❌ [INFINITE_MESSAGES] Error loading more messages:', fetchError);
        return;
      }

      if (data && data.length > 0) {
        const formattedMessages = data.reverse().map(formatMessage);
        setMessages(prev => [...formattedMessages, ...prev]);
        
        // Usar type guard para verificação segura
        const firstMessage = data[0];
        if (hasValidReadAt(firstMessage)) {
          oldestTimestampRef.current = firstMessage.read_at;
        }
        
        // Se trouxe menos de 30, provavelmente não tem mais
        if (data.length < 30) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ [INFINITE_MESSAGES] Error loading more:', error);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId, hasMore, loading]);

  const formatMessage = (record: any): InfiniteMessage => {
    return {
      id: record.id?.toString() || Math.random().toString(),
      content: record.message || '',
      timestamp: record.read_at || getBrazilianTimestamp(),
      sender: record.tipo_remetente === 'CONTATO_EXTERNO' ? 'customer' : 'agent',
      tipo_remetente: record.tipo_remetente,
      type: 'text',
      read: record.is_read || false,
      Nome_do_contato: record.nome_do_contato || record.Nome_do_contato,
      nome_do_contato: record.nome_do_contato || record.Nome_do_contato,
      mensagemtype: record.mensagemtype
    };
  };

  // Adicionar nova mensagem em tempo real
  const addMessage = useCallback((newMessage: InfiniteMessage) => {
    if (mountedRef.current) {
      setMessages(prev => {
        // Verificar se a mensagem já existe para evitar duplicatas
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          return prev;
        }
        return [...prev, newMessage];
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    messages,
    loading,
    hasMore,
    error,
    loadMoreMessages,
    addMessage
  };
};

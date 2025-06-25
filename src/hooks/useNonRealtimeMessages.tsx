
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannelSync } from '@/utils/channelMapping';

interface SimpleMessage {
  id: string;
  message: string;
  nome_do_contato?: string;
  tipo_remetente?: string;
  read_at?: string;
  mensagemtype?: string;
  is_read?: boolean;
}

export const useNonRealtimeMessages = (
  channelId: string | null, 
  conversationId: string | null
) => {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!channelId || !conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tableName = getTableNameForChannelSync(channelId);
      console.log(`📋 [NON_REALTIME_MESSAGES] Carregando mensagens da tabela ${tableName} para conversa ${conversationId}`);
      
      const { data, error: queryError } = await supabase
        .from(tableName as any)
        .select('id, message, nome_do_contato, tipo_remetente, read_at, mensagemtype, is_read')
        .eq('session_id', conversationId)
        .order('read_at', { ascending: true })
        .limit(200); // Aumentado para 200 mensagens

      if (queryError) {
        console.error('❌ [NON_REALTIME_MESSAGES] Database error:', queryError);
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
        is_read: record.is_read
      }));

      console.log(`✅ [NON_REALTIME_MESSAGES] ${formattedMessages.length} mensagens carregadas para conversa ${conversationId}`);
      setMessages(formattedMessages);
    } catch (err) {
      console.error('❌ [NON_REALTIME_MESSAGES] Error:', err);
      setError('Erro inesperado ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

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

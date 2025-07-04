
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannelSync } from '@/utils/channelMapping';

interface SimpleMessage {
  id: string;
  message: string;
  nome_do_contato?: string;
  tipo_remetente?: string;
  read_at?: string;
  mensagemtype?: string;
  media_url?: string;
}

export const useSimpleMessages = (channelId: string | null, conversationId: string | null) => {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
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
        console.error('❌ [SIMPLE_MESSAGES] Database error:', queryError);
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

      setMessages(formattedMessages);
    } catch (err) {
      console.error('❌ [SIMPLE_MESSAGES] Error:', err);
      setError('Erro inesperado ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [channelId, conversationId]);

  const refreshMessages = async () => {
    await loadMessages();
  };

  return { messages, loading, error, refreshMessages };
};

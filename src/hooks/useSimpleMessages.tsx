
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleMessage {
  id: string;
  session_id: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  media_base64?: string;
}

export const useSimpleMessages = (channelId: string | null, sessionId: string | null) => {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

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

  const loadMessages = async () => {
    if (!channelId || !sessionId || !isAuthenticated) {
      console.log('🔍 [SIMPLE_MESSAGES] Missing params:', { channelId, sessionId, isAuthenticated });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tableName = getTableName(channelId);
      console.log(`📋 [SIMPLE_MESSAGES] Loading from table: ${tableName}, session: ${sessionId}`);

      // Query corrigida - especificar campos explicitamente para evitar erros
      const { data: rawData, error: queryError } = await supabase
        .from(tableName as any)
        .select('id, session_id, message, read_at, tipo_remetente, Nome_do_contato, nome_do_contato, mensagemtype, media_base64')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true });

      if (queryError) {
        console.error('❌ [SIMPLE_MESSAGES] Query error:', queryError);
        setError(queryError.message);
        return;
      }

      console.log(`✅ [SIMPLE_MESSAGES] Loaded ${rawData?.length || 0} messages`);
      
      // Converter dados para o formato esperado
      const processedMessages: SimpleMessage[] = (rawData || []).map((row: any) => ({
        id: row.id?.toString() || '',
        session_id: row.session_id || '',
        message: row.message || '',
        read_at: row.read_at || new Date().toISOString(),
        tipo_remetente: row.tipo_remetente,
        Nome_do_contato: row.Nome_do_contato,
        nome_do_contato: row.nome_do_contato,
        mensagemtype: row.mensagemtype,
        media_base64: row.media_base64
      }));

      setMessages(processedMessages);

    } catch (err) {
      console.error('❌ [SIMPLE_MESSAGES] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && channelId && sessionId) {
      console.log(`🚀 [SIMPLE_MESSAGES] Effect triggered for user: ${user?.name}`);
      loadMessages();
    } else {
      console.log('⏳ [SIMPLE_MESSAGES] Waiting for params...');
      setMessages([]);
    }
  }, [channelId, sessionId, isAuthenticated]);

  return {
    messages,
    loading,
    error,
    refreshMessages: loadMessages
  };
};

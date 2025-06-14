
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleMessage {
  id: string;
  session_id: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
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
    console.log(`🔍 [SIMPLE_MESSAGES] Mapeando canal: ${channelId}`);
    
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
    console.log(`✅ [SIMPLE_MESSAGES] Canal: ${channelId} -> Tabela: ${tableName}`);
    return tableName;
  };

  const loadMessages = async () => {
    if (!channelId || !sessionId) {
      console.log('⚠️ [SIMPLE_MESSAGES] Parâmetros insuficientes:', { channelId, sessionId });
      setMessages([]);
      return;
    }

    if (!isAuthenticated) {
      console.log('⚠️ [SIMPLE_MESSAGES] Usuário não autenticado');
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tableName = getTableName(channelId);
      console.log(`📋 [SIMPLE_MESSAGES] Iniciando query na tabela: ${tableName}, sessão: ${sessionId}, usuário: ${user?.name}`);

      const { data: rawData, error: queryError } = await supabase
        .from(tableName as any)
        .select('id, session_id, message, read_at, tipo_remetente, nome_do_contato, mensagemtype, media_base64')
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true });

      if (queryError) {
        console.error('❌ [SIMPLE_MESSAGES] Erro na query:', queryError);
        setError(queryError.message);
        return;
      }

      console.log(`✅ [SIMPLE_MESSAGES] Query executada com sucesso. Dados recebidos:`, rawData?.length || 0);
      
      if (rawData && rawData.length > 0) {
        console.log(`📋 [SIMPLE_MESSAGES] Primeira mensagem exemplo:`, rawData[0]);
      }
      
      const processedMessages: SimpleMessage[] = (rawData || []).map((row: any) => ({
        id: row.id?.toString() || '',
        session_id: row.session_id || '',
        message: row.message || '',
        read_at: row.read_at || new Date().toISOString(),
        tipo_remetente: row.tipo_remetente,
        nome_do_contato: row.nome_do_contato,
        mensagemtype: row.mensagemtype,
        media_base64: row.media_base64
      }));

      console.log(`✅ [SIMPLE_MESSAGES] ${processedMessages.length} mensagens processadas para exibição`);
      setMessages(processedMessages);

    } catch (err) {
      console.error('❌ [SIMPLE_MESSAGES] Erro inesperado:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`🚀 [SIMPLE_MESSAGES] Effect acionado:`, {
      channelId,
      sessionId,
      isAuthenticated,
      user: user?.name
    });
    
    if (isAuthenticated && channelId && sessionId) {
      loadMessages();
    } else {
      console.log('⏳ [SIMPLE_MESSAGES] Aguardando parâmetros necessários...');
      setMessages([]);
      setError(null);
    }
  }, [channelId, sessionId, isAuthenticated, user?.name]);

  return {
    messages,
    loading,
    error,
    refreshMessages: loadMessages
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext';
import { ContactNameResolver } from '@/services/ContactNameResolver';

interface SimpleMessage {
  id: string;
  session_id: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  media_url?: string;
}

interface DatabaseMessage {
  id: number;
  session_id: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  media_url?: string;
}

export const useSimpleMessages = (channelId: string | null, sessionId: string | null) => {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const getTableName = (channelId: string): string => {
    console.log(`🔍 [SIMPLE_MESSAGES] Mapeando canal: ${channelId}`);
    
    const mapping: Record<string, string> = {
      // UUIDs principais
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
      // Fallbacks para nomes legados
      'chat': 'yelena_ai_conversas',
      'yelena': 'yelena_ai_conversas',
      'yelena-ai': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };
    
    const tableName = mapping[channelId] || 'yelena_ai_conversas';
    console.log(`✅ [SIMPLE_MESSAGES] Canal: ${channelId} -> Tabela: ${tableName}`);
    return tableName;
  };

  const completeMediaUrl = (media_url?: string): string | undefined => {
    if (!media_url) return undefined;
    
    if (media_url.startsWith('http')) {
      return media_url;
    }
    
    const baseUrl = 'https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/';
    const fullUrl = baseUrl + media_url;
    console.log(`🔗 [MEDIA_URL] Completando URL: ${media_url} -> ${fullUrl}`);
    return fullUrl;
  };

  const mapMessageType = (mensagemtype?: string): string => {
    if (!mensagemtype) return 'text';
    
    const typeMapping: Record<string, string> = {
      'audioMessage': 'audio',
      'imageMessage': 'image', 
      'videoMessage': 'video',
      'documentMessage': 'document',
      'stickerMessage': 'sticker',
      'conversation': 'text',
      'audio': 'audio',
      'image': 'image',
      'video': 'video',
      'document': 'document',
      'file': 'document',
      'sticker': 'sticker',
      'text': 'text'
    };
    
    const mapped = typeMapping[mensagemtype] || mensagemtype;
    console.log(`🔄 [MESSAGE_TYPE] ${mensagemtype} -> ${mapped}`);
    return mapped;
  };

  const extractPhoneFromSession = (sessionId: string): string => {
    const match = sessionId.match(/(\d+)/);
    return match ? match[1] : sessionId;
  };

  const loadMessages = async () => {
    console.log("🐛 [SIMPLE_MESSAGES] loadMessages chamado com:", { channelId, sessionId, isAuthenticated, user: user?.name });
    if (!channelId || !sessionId) {
      console.log("⚠️ [SIMPLE_MESSAGES] Parâmetros insuficientes para carregar mensagens:", { channelId, sessionId });
      setMessages([]);
      return;
    }

    if (!isAuthenticated) {
      console.log("⚠️ [SIMPLE_MESSAGES] Usuário não autenticado para carregar mensagens.");
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
        .select("id, session_id, message, read_at, tipo_remetente, nome_do_contato, mensagemtype, media_url")
        .eq("session_id", sessionId)
        .order("read_at", { ascending: true });

      if (queryError) {
        console.error("❌ [SIMPLE_MESSAGES] Erro na query:", queryError);
        setError(queryError.message);
        return;
      }

      console.log(`✅ [SIMPLE_MESSAGES] Query executada com sucesso. Dados recebidos:`, rawData?.length || 0);
      
      if (rawData && rawData.length > 0) {
        console.log(`📋 [SIMPLE_MESSAGES] Primeira mensagem exemplo:`, rawData[0]);
      }

      // Processar mensagens e resolver nomes usando ContactNameResolver
      const processedMessages: SimpleMessage[] = [];
      
      for (const row of (rawData as DatabaseMessage[]) || []) {
        const phoneNumber = extractPhoneFromSession(row.session_id);
        
        // Resolver nome do contato usando tabela unificada
        const resolvedName = await ContactNameResolver.resolveName(
          phoneNumber, 
          row.nome_do_contato
        );

        processedMessages.push({
          id: row.id?.toString() || "",
          session_id: row.session_id || "",
          message: row.message || "",
          read_at: row.read_at || new Date().toISOString(),
          tipo_remetente: row.tipo_remetente,
          nome_do_contato: resolvedName,
          mensagemtype: mapMessageType(row.mensagemtype),
          media_url: completeMediaUrl(row.media_url)
        });
      }

      console.log(`✅ [SIMPLE_MESSAGES] ${processedMessages.length} mensagens processadas com nomes resolvidos`);
      setMessages(processedMessages);

    } catch (err) {
      console.error("❌ [SIMPLE_MESSAGES] Erro inesperado:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let realtimeChannel: any = null;

    if (channelId && sessionId && isAuthenticated) {
      loadMessages();
      const tableName = getTableName(channelId);

      try {
        realtimeChannel = supabase
          .channel(`public:${tableName}:${sessionId}`)
          .on(
            'postgres_changes',
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: tableName, 
              filter: `session_id=eq.${sessionId}` 
            },
            async (payload) => {
              console.log(`📨 [SIMPLE_MESSAGES] Nova mensagem recebida via realtime:`, payload);
              if (payload && payload.new) {
                const novo = payload.new as DatabaseMessage;
                
                // Resolver nome da nova mensagem
                const phoneNumber = extractPhoneFromSession(novo.session_id);
                const resolvedName = await ContactNameResolver.resolveName(
                  phoneNumber, 
                  novo.nome_do_contato
                );
                
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === novo.id?.toString());
                  if (exists) {
                    console.log(`⚠️ [SIMPLE_MESSAGES] Mensagem já existe, ignorando:`, novo.id);
                    return prev;
                  }
                  
                  const newMessage = {
                    id: novo.id?.toString() || '',
                    session_id: novo.session_id || '',
                    message: novo.message || '',
                    read_at: novo.read_at || new Date().toISOString(),
                    tipo_remetente: novo.tipo_remetente,
                    nome_do_contato: resolvedName,
                    mensagemtype: mapMessageType(novo.mensagemtype), 
                    media_url: completeMediaUrl(novo.media_url)
                  };
                  
                  console.log(`✅ [SIMPLE_MESSAGES] Adicionando nova mensagem com nome resolvido:`, newMessage.id);
                  return [...prev, newMessage];
                });
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`✅ [SIMPLE_MESSAGES] Realtime subscription for ${tableName}:${sessionId} SUBSCRIBED`);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')  {
              console.error(`❌ [SIMPLE_MESSAGES] Realtime subscription error for ${tableName}:${sessionId}:`, err);
            }
          });
      } catch (realtimeError) {
        console.error(`❌ [SIMPLE_MESSAGES] Erro ao configurar realtime:`, realtimeError);
      }
    } else {
      console.log('⏳ [SIMPLE_MESSAGES] Aguardando parâmetros necessários para carregar mensagens ou autenticação...');
      setMessages([]);
      setError(null);
    }

    return () => {
      if (realtimeChannel) {
        const currentTableName = channelId ? getTableName(channelId) : '';
        console.log(`🗑️ [SIMPLE_MESSAGES] Removendo canal realtime para ${currentTableName}:${sessionId}`);
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [channelId, sessionId, isAuthenticated, user?.name]);

  return {
    messages,
    loading,
    error,
    refreshMessages: loadMessages
  };
};

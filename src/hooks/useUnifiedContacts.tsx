
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedContact } from '@/services/OptimizedContactService';
import { useAuth } from '@/contexts/AuthContext';

interface DatabaseMessage {
  message: string;
  read_at: string;
  mensagemtype?: string;
  is_read?: boolean;
}

export const useUnifiedContacts = () => {
  const [contacts, setContacts] = useState<OptimizedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { isAuthenticated } = useAuth();

  const loadUnifiedContacts = async () => {
    if (!isAuthenticated) {
      setContacts([]);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(10);

    try {
      // STEP 1: Buscar todos os contatos da tabela unificada
      const { data: unifiedContacts, error: contactsError } = await supabase
        .from('contacts')
        .select('phone_number, contact_name, channels, updated_at')
        .order('updated_at', { ascending: false });

      if (contactsError) {
        throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);
      }

      setLoadingProgress(50);

      // STEP 2: Para cada contato, buscar última mensagem e status
      const enrichedContacts: OptimizedContact[] = [];

      for (const contact of unifiedContacts || []) {
        try {
          // Buscar última mensagem de qualquer canal do contato
          let lastMessage = '';
          let lastMessageTime = contact.updated_at;
          let unreadCount = 0;

          // Verificar cada canal do contato
          for (const channel of contact.channels || []) {
            const tableName = getTableNameForChannel(channel);
            if (!tableName) continue;

            try {
              // Buscar mensagens mais recentes
              const messagesResult = await supabase
                .from(tableName as any)
                .select('message, read_at, is_read, mensagemtype')
                .ilike('session_id', `%${contact.phone_number}%`)
                .order('read_at', { ascending: false })
                .limit(1);

              if (messagesResult.data && messagesResult.data.length > 0) {
                const msg = messagesResult.data[0] as unknown as DatabaseMessage;
                const msgTime = new Date(msg.read_at || '').toISOString();
                
                // Se esta mensagem é mais recente
                if (msgTime > lastMessageTime) {
                  lastMessageTime = msgTime;
                  lastMessage = formatLastMessage(msg.message, msg.mensagemtype);
                }
              }

              // Contar mensagens não lidas
              const { count } = await supabase
                .from(tableName as any)
                .select('*', { count: 'exact', head: true })
                .ilike('session_id', `%${contact.phone_number}%`)
                .eq('is_read', false);

              if (count) {
                unreadCount += count;
              }
            } catch (channelError) {
              console.warn(`⚠️ [UNIFIED_CONTACTS] Erro no canal ${channel}:`, channelError);
            }
          }

          // Determinar status baseado em mensagens não lidas
          const status = unreadCount > 0 ? 'pendente' : 'resolvida';

          enrichedContacts.push({
            id: `unified-${contact.phone_number}`,
            nome: contact.contact_name,
            telefone: contact.phone_number,
            ultimaMensagem: lastMessage || 'Sem mensagens',
            tempo: formatTimeAgo(lastMessageTime),
            status: status as 'pendente' | 'em_andamento' | 'resolvida',
            canais: contact.channels || []
          });
        } catch (contactError) {
          console.error(`❌ [UNIFIED_CONTACTS] Erro processando contato ${contact.phone_number}:`, contactError);
        }
      }

      setLoadingProgress(90);

      // STEP 3: Ordenar contatos (pendentes primeiro, depois por tempo)
      enrichedContacts.sort((a, b) => {
        if (a.status === 'pendente' && b.status !== 'pendente') return -1;
        if (b.status === 'pendente' && a.status !== 'pendente') return 1;
        
        // Ordenar por tempo (mais recente primeiro)
        const timeA = new Date(a.tempo.includes('h') || a.tempo.includes('min') ? Date.now() : a.tempo);
        const timeB = new Date(b.tempo.includes('h') || b.tempo.includes('min') ? Date.now() : b.tempo);
        return timeB.getTime() - timeA.getTime();
      });

      setContacts(enrichedContacts);
      setLoadingProgress(100);

      console.log(`✅ [UNIFIED_CONTACTS] Carregados ${enrichedContacts.length} contatos unificados`);

    } catch (err) {
      console.error('❌ [UNIFIED_CONTACTS] Erro ao carregar contatos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setContacts([]);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUnifiedContacts();
    }
  }, [isAuthenticated]);

  return {
    contacts,
    loading,
    error,
    loadingProgress,
    refetch: loadUnifiedContacts
  };
};

// Helper functions
const getTableNameForChannel = (channelId: string): string | null => {
  const mapping: Record<string, string> = {
    'chat': 'yelena_ai_conversas',
    'canarana': 'canarana_conversas',
    'souto-soares': 'souto_soares_conversas',
    'joao-dourado': 'joao_dourado_conversas',
    'america-dourada': 'america_dourada_conversas',
    'gerente-lojas': 'gerente_lojas_conversas',
    'gerente-externo': 'gerente_externo_conversas'
  };
  
  return mapping[channelId] || null;
};

const formatLastMessage = (message: string, messageType?: string): string => {
  if (!message) return '';
  
  // Se for mídia, mostrar placeholder amigável
  if (messageType && messageType !== 'text' && messageType !== 'conversation') {
    switch (messageType) {
      case 'image': case 'imageMessage': return '📷 Imagem';
      case 'audio': case 'audioMessage': case 'ptt': return '🎵 Áudio';
      case 'video': case 'videoMessage': return '🎥 Vídeo';
      case 'document': case 'documentMessage': return '📄 Documento';
      default: return '📎 Mídia';
    }
  }

  // Truncar mensagens longas
  return message.length > 50 ? message.substring(0, 50) + '...' : message;
};

const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}min`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

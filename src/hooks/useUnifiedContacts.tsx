
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Memoizar função de carregamento para evitar re-renders desnecessários
  const loadUnifiedContacts = useCallback(async () => {
    if (!isAuthenticated) {
      setContacts([]);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(10);

    try {
      const { data: unifiedContacts, error: contactsError } = await supabase
        .from('contacts')
        .select('phone_number, contact_name, channels, updated_at')
        .order('updated_at', { ascending: false });

      if (contactsError) {
        throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);
      }

      setLoadingProgress(50);

      // Criar conversas separadas por canal de forma mais eficiente
      const separateContacts: OptimizedContact[] = [];
      const processedContacts = new Set<string>(); // Evitar duplicatas

      for (const contact of unifiedContacts || []) {
        for (const channel of contact.channels || []) {
          const uniqueId = `${channel}-${contact.phone_number}`;
          
          // Evitar duplicatas
          if (processedContacts.has(uniqueId)) {
            continue;
          }
          processedContacts.add(uniqueId);

          try {
            const tableName = getTableNameForChannel(channel);
            if (!tableName) continue;

            // Query otimizada com limit menor
            const messagesResult = await supabase
              .from(tableName as any)
              .select('message, read_at, is_read, mensagemtype')
              .ilike('session_id', `%${contact.phone_number}%`)
              .order('read_at', { ascending: false })
              .limit(1);

            let lastMessage = '';
            let lastMessageTime = contact.updated_at;
            let unreadCount = 0;

            if (messagesResult.data && messagesResult.data.length > 0) {
              const msg = messagesResult.data[0] as unknown as DatabaseMessage;
              lastMessageTime = msg.read_at || contact.updated_at;
              lastMessage = formatLastMessage(msg.message, msg.mensagemtype);
            }

            // Contar mensagens não lidas de forma mais eficiente
            const { count } = await supabase
              .from(tableName as any)
              .select('*', { count: 'exact', head: true })
              .ilike('session_id', `%${contact.phone_number}%`)
              .eq('is_read', false);

            unreadCount = count || 0;
            const status = unreadCount > 0 ? 'pendente' : 'resolvida';

            separateContacts.push({
              id: uniqueId,
              nome: contact.contact_name,
              telefone: contact.phone_number,
              ultimaMensagem: lastMessage || 'Sem mensagens',
              tempo: formatTimeAgo(lastMessageTime),
              status: status as 'pendente' | 'em_andamento' | 'resolvida',
              canais: [channel],
              channelId: channel
            });

          } catch (channelError) {
            console.warn(`⚠️ [UNIFIED_CONTACTS] Erro no canal ${channel}:`, channelError);
          }
        }
      }

      setLoadingProgress(90);

      // Otimizar ordenação
      separateContacts.sort((a, b) => {
        if (a.status === 'pendente' && b.status !== 'pendente') return -1;
        if (b.status === 'pendente' && a.status !== 'pendente') return 1;
        
        const timeA = new Date(a.tempo.includes('h') || a.tempo.includes('min') ? Date.now() : a.tempo);
        const timeB = new Date(b.tempo.includes('h') || b.tempo.includes('min') ? Date.now() : b.tempo);
        return timeB.getTime() - timeA.getTime();
      });

      setContacts(separateContacts);
      setLoadingProgress(100);

      console.log(`✅ [UNIFIED_CONTACTS] ${separateContacts.length} conversas isoladas por canal`);

    } catch (err) {
      console.error('❌ [UNIFIED_CONTACTS] Erro ao carregar contatos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setContacts([]);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  }, [isAuthenticated]);

  // Implementar debounce para evitar carregamentos excessivos
  const debouncedLoad = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadUnifiedContacts();
      }, 300);
    };
  }, [loadUnifiedContacts]);

  useEffect(() => {
    if (isAuthenticated) {
      debouncedLoad();
    }
  }, [isAuthenticated, debouncedLoad]);

  return {
    contacts,
    loading,
    error,
    loadingProgress,
    refetch: loadUnifiedContacts
  };
};

// Helper functions otimizadas
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
  
  if (messageType && messageType !== 'text' && messageType !== 'conversation') {
    switch (messageType) {
      case 'image': case 'imageMessage': return '📷 Imagem';
      case 'audio': case 'audioMessage': case 'ptt': return '🎵 Áudio';
      case 'video': case 'videoMessage': return '🎥 Vídeo';
      case 'document': case 'documentMessage': return '📄 Documento';
      default: return '📎 Mídia';
    }
  }

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

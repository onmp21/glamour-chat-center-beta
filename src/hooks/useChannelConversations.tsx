
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CHANNEL_TABLE_MAPPING } from '@/utils/channelMapping';
import { isMediaMessage, getMediaTypeFromMessageType } from '@/utils/mediaUtils';
import { useUnifiedConversationStatus } from './useUnifiedConversationStatus';

export interface ChannelConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string | null;
  status: 'unread' | 'in_progress' | 'resolved';
  updated_at: string;
  unread_count?: number;
  message_count?: number;
}

interface RawConversationData {
  session_id: string;
  nome_do_contato?: string;
  message?: string;
  mensagemtype?: string;
  read_at?: string;
}

// Type guard para verificar se um objeto é válido para conversação
const isValidConversationItem = (item: unknown): item is Record<string, any> => {
  return item !== null && 
         item !== undefined && 
         typeof item === 'object' && 
         'session_id' in item;
};

export const useChannelConversations = (channelId: string | null) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const realtimeChannelRef = useRef<any>(null);
  const { handleNewMessage } = useUnifiedConversationStatus();

  // Função para formatar a última mensagem baseada no tipo
  const formatLastMessage = (message: string, messageType?: string): string => {
    if (!message) return '';
    
    // Verificar se é uma mensagem de mídia pelo tipo
    if (messageType && isMediaMessage(message, messageType)) {
      const mediaType = getMediaTypeFromMessageType(messageType);
      
      switch (mediaType) {
        case 'image':
          return '📷 Imagem';
        case 'video':
          return '🎥 Vídeo';
        case 'audio':
          return '🎵 Áudio';
        case 'document':
          return '📄 Documento';
        default:
          return '📎 Mídia';
      }
    }
    
    // Verificar se é uma URL de mídia
    const lowerMessage = message.toLowerCase();
    if (message.startsWith('data:') || message.startsWith('http://') || message.startsWith('https://')) {
      if (lowerMessage.includes('image') || lowerMessage.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/)) {
        return '📷 Imagem';
      }
      if (lowerMessage.includes('video') || lowerMessage.match(/\.(mp4|avi|mov|wmv|webm)($|\?)/)) {
        return '🎥 Vídeo';
      }
      if (lowerMessage.includes('audio') || lowerMessage.match(/\.(mp3|ogg|wav|m4a|aac)($|\?)/)) {
        return '🎵 Áudio';
      }
      if (lowerMessage.includes('pdf') || lowerMessage.includes('document') || lowerMessage.match(/\.(pdf|doc|docx|txt|xls|xlsx)($|\?)/)) {
        return '📄 Documento';
      }
      return '📎 Arquivo';
    }
    
    return message;
  };

  const loadConversations = async () => {
    if (!channelId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tableName = CHANNEL_TABLE_MAPPING[channelId];
      if (!tableName) {
        console.error(`❌ [CHANNEL_CONVERSATIONS] No table mapping found for channel: ${channelId}`);
        setError('Configuração de canal não encontrada');
        return;
      }

      console.log(`📊 [CHANNEL_CONVERSATIONS] Loading conversations for ${channelId} from ${tableName}`);

      // Buscar conversas únicas com última mensagem
      const { data: rawData, error: fetchError } = await supabase
        .from(tableName as any)
        .select('session_id, nome_do_contato, message, mensagemtype, read_at, is_read')
        .not('session_id', 'is', null)
        .order('read_at', { ascending: false });

      if (fetchError) {
        console.error(`❌ [CHANNEL_CONVERSATIONS] Error fetching data:`, fetchError);
        setError('Erro ao carregar conversas');
        return;
      }

      if (!rawData || !Array.isArray(rawData)) {
        console.error(`❌ [CHANNEL_CONVERSATIONS] Invalid data format received`);
        setError('Formato de dados inválido');
        return;
      }

      // Filtrar dados válidos usando type guard
      const validData: RawConversationData[] = [];
      for (const item of rawData) {
        if (!isValidConversationItem(item)) {
          continue;
        }
        
        const typedItem = item as any;
        const sessionId = typedItem.session_id;
        if (sessionId && typeof sessionId === 'string' && sessionId.trim() !== '') {
          validData.push(typedItem as RawConversationData);
        }
      }

      // Agrupar por session_id e pegar a mensagem mais recente
      const conversationsMap = new Map<string, ChannelConversation>();
      
      validData.forEach((row) => {
        if (!row.session_id || row.session_id.trim() === '') return;

        const phoneNumber = row.session_id.split('@')[0] || row.session_id;
        const contactName = row.nome_do_contato || 'Cliente';
        
        const formattedMessage = formatLastMessage(row.message || '', row.mensagemtype);

        if (!conversationsMap.has(row.session_id)) {
          conversationsMap.set(row.session_id, {
            id: row.session_id,
            contact_name: contactName,
            contact_phone: phoneNumber,
            last_message: formattedMessage,
            last_message_time: row.read_at || null,
            status: 'unread' as const,
            updated_at: row.read_at || new Date().toISOString(),
            unread_count: 0,
            message_count: 1
          });
        } else {
          const existing = conversationsMap.get(row.session_id)!;
          if (row.read_at && (!existing.last_message_time || row.read_at > existing.last_message_time)) {
            existing.last_message = formattedMessage;
            existing.last_message_time = row.read_at;
            existing.updated_at = row.read_at;
          }
          existing.message_count = (existing.message_count || 0) + 1;
        }
      });

      // Buscar contagem de mensagens não lidas para cada conversa
      for (const conversation of conversationsMap.values()) {
        try {
          const { count: unreadCount } = await supabase
            .from(tableName as any)
            .select('id', { count: 'exact', head: true })
            .eq('session_id', conversation.id)
            .eq('is_read', false);

          conversation.unread_count = unreadCount || 0;
        } catch (error) {
          console.error(`❌ [CHANNEL_CONVERSATIONS] Error counting unread for ${conversation.id}:`, error);
          conversation.unread_count = 0;
        }
      }

      const conversationsList = Array.from(conversationsMap.values())
        .sort((a, b) => {
          const aUnread = (a.unread_count || 0) > 0;
          const bUnread = (b.unread_count || 0) > 0;
          
          if (aUnread && !bUnread) return -1;
          if (bUnread && !aUnread) return 1;
          
          const timeA = a.last_message_time || a.updated_at;
          const timeB = b.last_message_time || b.updated_at;
          
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });

      if (mountedRef.current) {
        setConversations(conversationsList);
        console.log(`✅ [CHANNEL_CONVERSATIONS] Loaded ${conversationsList.length} conversations for ${channelId}`);
      }

    } catch (error) {
      console.error(`❌ [CHANNEL_CONVERSATIONS] Unexpected error:`, error);
      if (mountedRef.current) {
        setError('Erro inesperado ao carregar conversas');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Setup realtime subscription - integrado com sistema de status
  useEffect(() => {
    mountedRef.current = true;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    if (!channelId) {
      return;
    }

    const tableName = CHANNEL_TABLE_MAPPING[channelId];
    if (!tableName) {
      console.warn(`[CHANNEL_CONVERSATIONS] No table mapping found for channel: ${channelId}`);
      return;
    }

    console.log(`✅ [CHANNEL_CONVERSATIONS] Setting up realtime for ${tableName}`);

    const channel = supabase
      .channel(`conversations_${tableName}_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log('🔥 [CHANNEL_CONVERSATIONS] New message detected:', payload.new);
          
          if (mountedRef.current && payload.new) {
            const sessionId = payload.new.session_id;
            const messageTime = payload.new.read_at || new Date().toISOString();
            
            // Atualizar status para pendente quando nova mensagem chegar
            if (sessionId) {
              handleNewMessage(channelId, sessionId, messageTime);
            }
            
            // Recarregar conversas
            setTimeout(() => {
              loadConversations();
            }, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log('🔄 [CHANNEL_CONVERSATIONS] Message updated:', payload.new);
          
          if (mountedRef.current) {
            setTimeout(() => {
              loadConversations();
            }, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [CHANNEL_CONVERSATIONS] Realtime status for ${tableName}:`, status);
      });

    realtimeChannelRef.current = channel;

    loadConversations();
    
    return () => {
      mountedRef.current = false;
      
      if (realtimeChannelRef.current) {
        console.log(`🔌 [CHANNEL_CONVERSATIONS] Cleaning up realtime for ${tableName}`);
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [channelId, handleNewMessage]);

  const refreshConversations = () => {
    loadConversations();
  };

  return {
    conversations,
    loading,
    error,
    refreshConversations
  };
};

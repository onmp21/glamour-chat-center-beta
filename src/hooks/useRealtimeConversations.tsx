
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import { isMediaMessage, getMediaTypeFromMessageType } from '@/utils/mediaUtils';

interface RealtimeConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  updated_at: string;
  unread_count: number;
  message_count: number;
}

export const useRealtimeConversations = (channelId: string | null) => {
  const [conversations, setConversations] = useState<RealtimeConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Função para formatar a última mensagem baseada no tipo - melhorada
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
    
    // Verificar se é uma URL de mídia (incluindo data URLs e HTTP URLs)
    const lowerMessage = message.toLowerCase();
    if (message.startsWith('data:') || message.startsWith('http://') || message.startsWith('https://')) {
      // Detectar tipo por extensão ou conteúdo
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
      // Se é uma URL mas não conseguimos detectar o tipo, assumir que é arquivo
      return '📎 Arquivo';
    }
    
    // Se não é mídia, retornar o texto normal
    return message;
  };

  const loadConversations = useCallback(async () => {
    if (!channelId) {
      setConversations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tableName = getTableNameForChannelSync(channelId);
      
      const { data, error: queryError } = await supabase
        .from(tableName as any)
        .select('session_id, message, nome_do_contato, read_at, is_read, mensagemtype')
        .order('read_at', { ascending: false });

      if (queryError) {
        console.error('❌ [REALTIME_CONVERSATIONS] Database error:', queryError);
        setError('Erro ao carregar conversas');
        return;
      }

      // Agrupar mensagens por session_id
      const conversationsMap = new Map<string, RealtimeConversation>();
      
      data?.forEach((record: any) => {
        const sessionId = record.session_id;
        if (!sessionId) return;
        
        const phoneNumber = sessionId.split('@')[0];
        const contactName = record.nome_do_contato || phoneNumber;
        
        if (!conversationsMap.has(sessionId)) {
          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: contactName,
            contact_phone: phoneNumber,
            last_message: formatLastMessage(record.message || '', record.mensagemtype),
            last_message_time: record.read_at || new Date().toISOString(),
            status: 'unread' as const,
            updated_at: record.read_at || new Date().toISOString(),
            unread_count: 0,
            message_count: 0
          });
        }
        
        const conversation = conversationsMap.get(sessionId)!;
        conversation.message_count++;
        
        if (!record.is_read) {
          conversation.unread_count++;
        }
        
        // Manter a mensagem mais recente
        if (record.read_at > conversation.last_message_time) {
          conversation.last_message = formatLastMessage(record.message || '', record.mensagemtype);
          conversation.last_message_time = record.read_at;
          conversation.updated_at = record.read_at;
        }
      });

      const conversationsList = Array.from(conversationsMap.values())
        .sort((a, b) => {
          // Priorizar conversas com mensagens não lidas
          const aUnread = a.unread_count > 0;
          const bUnread = b.unread_count > 0;
          
          if (aUnread && !bUnread) return -1;
          if (bUnread && !aUnread) return 1;
          
          // Ordenar por data mais recente
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });

      if (mountedRef.current) {
        setConversations(conversationsList);
        console.log(`✅ [REALTIME_CONVERSATIONS] Loaded ${conversationsList.length} conversations`);
      }
    } catch (err) {
      console.error('❌ [REALTIME_CONVERSATIONS] Error:', err);
      if (mountedRef.current) {
        setError('Erro inesperado ao carregar conversas');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [channelId]);

  // Setup Supabase realtime subscription - melhorada para detectar novas conversas
  useEffect(() => {
    mountedRef.current = true;
    
    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!channelId) {
      return;
    }

    const tableName = getTableNameForChannelSync(channelId);
    if (!tableName) {
      console.warn(`[REALTIME_CONVERSATIONS] No table mapping found for channel: ${channelId}`);
      return;
    }

    console.log(`✅ [REALTIME_CONVERSATIONS] Setting up Supabase realtime for ${tableName}`);

    // Create Supabase realtime channel
    const channel = supabase
      .channel(`conversations_${tableName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log('🔥 [REALTIME_CONVERSATIONS] New message for conversations:', payload.new);
          
          if (mountedRef.current) {
            // Recarregar conversas quando nova mensagem chegar (incluindo novas conversas)
            setTimeout(() => {
              loadConversations();
            }, 50); // Delay reduzido para resposta mais rápida
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
          console.log('🔄 [REALTIME_CONVERSATIONS] Message updated for conversations:', payload.new);
          
          if (mountedRef.current) {
            // Recarregar conversas quando mensagem for atualizada
            setTimeout(() => {
              loadConversations();
            }, 50);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME_CONVERSATIONS] Subscription status for ${tableName}:`, status);
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      
      if (channelRef.current) {
        console.log(`🔌 [REALTIME_CONVERSATIONS] Cleaning up realtime subscription for ${tableName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelId, loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return { 
    conversations, 
    loading, 
    error, 
    refreshConversations: loadConversations 
  };
};

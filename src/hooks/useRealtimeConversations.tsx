
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getTableNameForChannelSync } from '@/utils/channelMapping';

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
        .select('session_id, message, nome_do_contato, read_at, is_read')
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
        const phoneNumber = sessionId.split('@')[0];
        const contactName = record.nome_do_contato || phoneNumber;
        
        if (!conversationsMap.has(sessionId)) {
          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: contactName,
            contact_phone: phoneNumber,
            last_message: record.message || '',
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
          conversation.last_message = record.message || '';
          conversation.last_message_time = record.read_at;
          conversation.updated_at = record.read_at;
        }
      });

      const conversationsList = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      if (mountedRef.current) {
        setConversations(conversationsList);
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

  // Setup Supabase realtime subscription - APENAS REALTIME NATIVO
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
            // Recarregar conversas quando nova mensagem chegar
            loadConversations();
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
            loadConversations();
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

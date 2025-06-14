
import { useState, useEffect } from 'react';
import { MessageService } from '@/services/MessageService';
import { ConversationStats, RawMessage } from '@/types/messages';

export const useConversationStats = (channelId: string) => {
  const [stats, setStats] = useState<ConversationStats>({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!channelId) return;

      try {
        setLoading(true);
        const messageService = new MessageService(channelId);
        
        // Get all messages for the channel
        const messagesResult = await messageService.getAllMessages();
        const messages: RawMessage[] = messagesResult || [];

        // Convert messages to proper format
        const formattedMessages: RawMessage[] = messages.map(msg => ({
          id: msg.id,
          session_id: msg.session_id,
          message: msg.message,
          mensagemtype: msg.mensagemtype,
          tipo_remetente: msg.tipo_remetente,
          nome_do_contato: msg.nome_do_contato,
          media_base64: msg.media_base64,
          is_read: msg.is_read,
          read_at: msg.read_at,
          sender: msg.tipo_remetente || 'unknown',
          timestamp: new Date().toISOString(),
          content: msg.message
        }));

        // Calculate stats from messages
        const uniqueSessions = new Set(formattedMessages.map(m => m.session_id));
        const totalConversations = uniqueSessions.size;
        
        // Count active conversations (those with messages in last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const activeConversations = formattedMessages.filter(m => 
          new Date(m.timestamp) > yesterday
        ).length;

        const totalMessages = formattedMessages.length;
        const unreadMessages = formattedMessages.filter(m => !m.is_read).length;

        setStats({
          totalConversations,
          activeConversations,
          totalMessages,
          unreadMessages
        });
      } catch (error) {
        console.error('Error loading conversation stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [channelId]);

  return { stats, loading };
};

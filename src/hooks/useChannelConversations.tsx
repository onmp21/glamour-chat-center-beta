import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChannelConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string | null;
  last_message_time: string | null;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count?: number;
  updated_at: string;
}

export const useChannelConversations = (channelId: string) => {
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConversations = useCallback(async () => {
    if (!channelId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Simulação de dados para manter compatibilidade
      const mockConversations: ChannelConversation[] = [
        {
          id: '1',
          contact_name: 'João Silva',
          contact_phone: '+55 11 99999-9999',
          last_message: 'Olá, gostaria de mais informações',
          last_message_time: new Date().toISOString(),
          status: 'unread',
          unread_count: 3,
          updated_at: new Date().toISOString()
        },
        {
          id: '2', 
          contact_name: 'Maria Santos',
          contact_phone: '+55 11 88888-8888',
          last_message: 'Obrigada pelo atendimento',
          last_message_time: new Date(Date.now() - 3600000).toISOString(),
          status: 'resolved',
          unread_count: 0,
          updated_at: new Date().toISOString()
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conversas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [channelId, toast]);

  const updateConversationStatus = useCallback(async (
    conversationId: string, 
    status: 'unread' | 'in_progress' | 'resolved'
  ) => {
    try {
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              status, 
              updated_at: new Date().toISOString(),
              unread_count: status === 'in_progress' || status === 'resolved' ? 0 : conv.unread_count || 0
            } 
          : conv
      ));
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da conversa",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    updateConversationStatus,
    refreshConversations: loadConversations
  };
};


import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/hooks/use-toast';
import { getTableNameForChannelSync } from '@/utils/channelMapping';

export const useConversationStatus = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Auto-resolve old conversations (run on component mount)
  useEffect(() => {
    const autoResolveOldConversations = () => {
      const channelIds = [
        'af1e5797-edc6-4ba3-a57a-25cf7297c4d6', // yelena
        '011b69ba-cf25-4f63-af2e-4ad0260d9516', // canarana
        'b7996f75-41a7-4725-8229-564f31868027', // souto-soares
        '621abb21-60b2-4ff2-a0a6-172a94b4b65c', // joao-dourado
        '64d8acad-c645-4544-a1e6-2f0825fae00b', // america-dourada
        'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce', // gerente-lojas
        'd2892900-ca8f-4b08-a73f-6b7aa5866ff7', // gerente-externo
        '1e233898-5235-40d7-bf9c-55d46e4c16a1'  // pedro
      ];

      channelIds.forEach(channelId => {
        // Verificar conversas no localStorage e auto-resolver se necessário
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`conversation_status_${channelId}_`)) {
            const conversationId = key.split('_').pop();
            const status = localStorage.getItem(key);
            
            // Se não está resolvida, verificar se deve ser auto-resolvida
            if (status !== 'resolved' && conversationId) {
              // Verificar timestamp da última atividade (simulado)
              const lastActivityKey = `last_activity_${channelId}_${conversationId}`;
              const lastActivity = localStorage.getItem(lastActivityKey);
              
              if (lastActivity) {
                const lastActivityDate = new Date(lastActivity);
                const twentyFourHoursAgo = new Date();
                twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
                
                if (lastActivityDate < twentyFourHoursAgo) {
                  localStorage.setItem(key, 'resolved');
                  console.log(`🤖 Auto-resolved conversation ${conversationId} after 24h`);
                }
              }
            }
          }
        });
      });
    };

    // Executar auto-resolve na inicialização
    autoResolveOldConversations();

    // Configurar intervalo para verificar periodicamente (a cada hora)
    const interval = setInterval(autoResolveOldConversations, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const updateConversationStatus = useCallback(async (
    channelId: string,
    conversationId: string, 
    status: 'unread' | 'in_progress' | 'resolved',
    showToastNotification: boolean = true
  ) => {
    if (!channelId || !conversationId) {
      console.error('❌ [CONVERSATION_STATUS] Missing channelId or conversationId');
      return false;
    }
    
    try {
      setUpdating(true);
      
      const tableName = getTableNameForChannelSync(channelId);
      
      // Marcar mensagens como lidas se o status for 'in_progress' ou 'resolved'
      if (status === 'in_progress' || status === 'resolved') {
        const { error: markReadError } = await supabase.rpc('mark_messages_as_read', {
          table_name: tableName,
          p_session_id: conversationId
        });
        
        if (markReadError) {
          console.error('❌ [CONVERSATION_STATUS] Error marking messages as read:', markReadError);
        }
      }
      
      // Salvar status no localStorage para persistência da UI
      const statusKey = `conversation_status_${channelId}_${conversationId}`;
      localStorage.setItem(statusKey, status);
      
      // Atualizar timestamp da última atividade
      const lastActivityKey = `last_activity_${channelId}_${conversationId}`;
      localStorage.setItem(lastActivityKey, new Date().toISOString());
      
      // Exibir toast apenas se showToastNotification for true
      if (showToastNotification) {
        const statusMessages = {
          'unread': 'não lida',
          'in_progress': 'em andamento', 
          'resolved': 'resolvida'
        };
        
        toast({
          title: "Status atualizado",
          description: `Conversa marcada como ${statusMessages[status]}`,
        });
      }
      
      return true;
    } catch (err) {
      console.error('❌ [CONVERSATION_STATUS] Error updating conversation status:', err);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da conversa",
        variant: "destructive"
      });
      return false;
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  const getConversationStatus = useCallback((channelId: string, conversationId: string): 'unread' | 'in_progress' | 'resolved' => {
    const statusKey = `conversation_status_${channelId}_${conversationId}`;
    const savedStatus = localStorage.getItem(statusKey);
    return (savedStatus as 'unread' | 'in_progress' | 'resolved') || 'unread';
  }, []);

  return {
    updateConversationStatus,
    getConversationStatus,
    updating
  };
};

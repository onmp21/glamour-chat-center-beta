import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.ts';

export type ConversationStatus = 'unread' | 'in_progress' | 'resolved';

interface ConversationStatusData {
  status: ConversationStatus;
  lastActivity: string;
  lastViewed: string;
}

export const useConversationStatusEnhanced = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Melhorar persistência com localStorage mais robusto
  const getStatusKey = (channelId: string, conversationId: string) => 
    `conversation_status_${channelId}_${conversationId}`;

  const getConversationStatusData = useCallback((channelId: string, conversationId: string): ConversationStatusData => {
    const statusKey = getStatusKey(channelId, conversationId);
    const savedData = localStorage.getItem(statusKey);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          status: parsed.status || 'unread',
          lastActivity: parsed.lastActivity || new Date().toISOString(),
          lastViewed: parsed.lastViewed || new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ [STATUS] Error parsing saved status:', error);
      }
    }
    
    return {
      status: 'unread',
      lastActivity: new Date().toISOString(),
      lastViewed: new Date().toISOString()
    };
  }, []);

  const saveConversationStatusData = useCallback((
    channelId: string, 
    conversationId: string, 
    data: ConversationStatusData
  ) => {
    const statusKey = getStatusKey(channelId, conversationId);
    localStorage.setItem(statusKey, JSON.stringify(data));
    
    // Também salvar em uma estrutura global para estatísticas mais rápidas
    const globalKey = 'conversation_stats_cache';
    const globalStats = JSON.parse(localStorage.getItem(globalKey) || '{}');
    
    if (!globalStats[channelId]) {
      globalStats[channelId] = {};
    }
    
    globalStats[channelId][conversationId] = data;
    localStorage.setItem(globalKey, JSON.stringify(globalStats));
  }, []);

  // Auto-resolver conversas antigas
  useEffect(() => {
    const checkAndAutoResolve = () => {
      console.log('🤖 [STATUS] Checking for auto-resolve candidates');
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('conversation_status_')) {
          try {
            const statusData = JSON.parse(localStorage.getItem(key) || '{}');
            
            if (statusData.status === 'in_progress' && statusData.lastActivity) {
              const lastActivityDate = new Date(statusData.lastActivity);
              if (lastActivityDate < twentyFourHoursAgo) {
                const updatedData = { ...statusData, status: 'resolved' };
                localStorage.setItem(key, JSON.stringify(updatedData));
                console.log(`🤖 [STATUS] Auto-resolved conversation: ${key}`);
              }
            }
          } catch (error) {
            console.error('❌ [STATUS] Error in auto-resolve:', error);
          }
        }
      });
    };

    // Verificar imediatamente e depois a cada hora
    checkAndAutoResolve();
    const interval = setInterval(checkAndAutoResolve, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const updateConversationStatus = useCallback(async (
    channelId: string,
    conversationId: string, 
    status: ConversationStatus,
    showToast: boolean = true
  ) => {
    if (!channelId || !conversationId) {
      console.error('❌ [STATUS] Missing channelId or conversationId');
      return false;
    }
    
    try {
      setUpdating(true);
      console.log(`🔄 [STATUS] Updating conversation ${conversationId} in ${channelId} to ${status}`);
      
      const currentData = getConversationStatusData(channelId, conversationId);
      const updatedData: ConversationStatusData = {
        ...currentData,
        status,
        lastActivity: new Date().toISOString()
      };
      
      saveConversationStatusData(channelId, conversationId, updatedData);
      
      // Marcar mensagens como lidas no banco se necessário
      if (status === 'in_progress' || status === 'resolved') {
        try {
          const { error } = await supabase.rpc('mark_messages_as_read', {
            table_name: `${channelId}_conversas`,
            p_session_id: conversationId
          });
          
          if (error) {
            console.error('❌ [STATUS] Error marking messages as read:', error);
          } else {
            console.log('✅ [STATUS] Messages marked as read in database');
          }
        } catch (dbError) {
          console.error('❌ [STATUS] Database error:', dbError);
        }
      }
      
      if (showToast) {
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
      
      console.log('✅ [STATUS] Status updated successfully');
      return true;
    } catch (err) {
      console.error('❌ [STATUS] Error updating conversation status:', err);
      if (showToast) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status da conversa",
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setUpdating(false);
    }
  }, [toast, getConversationStatusData, saveConversationStatusData]);

  const getConversationStatus = useCallback((channelId: string, conversationId: string): ConversationStatus => {
    const data = getConversationStatusData(channelId, conversationId);
    return data.status;
  }, [getConversationStatusData]);

  const markConversationAsViewed = useCallback(async (channelId: string, conversationId: string) => {
    console.log(`👁️ [STATUS] Marking conversation ${conversationId} as viewed`);
    const currentData = getConversationStatusData(channelId, conversationId);
    
    // Auto-transição de unread para in_progress quando visualizada
    if (currentData.status === 'unread') {
      await updateConversationStatus(channelId, conversationId, 'in_progress', false);
    } else {
      // Apenas atualizar timestamp de visualização
      const updatedData: ConversationStatusData = {
        ...currentData,
        lastViewed: new Date().toISOString()
      };
      saveConversationStatusData(channelId, conversationId, updatedData);
    }
  }, [getConversationStatusData, updateConversationStatus, saveConversationStatusData]);

  const getAllConversationStats = useCallback(() => {
    const globalKey = 'conversation_stats_cache';
    const globalStats = JSON.parse(localStorage.getItem(globalKey) || '{}');
    return globalStats;
  }, []);

  return {
    updateConversationStatus,
    getConversationStatus,
    markConversationAsViewed,
    getAllConversationStats,
    updating
  };
};


import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type ConversationStatus = 'unread' | 'in_progress' | 'resolved';

interface ConversationStatusData {
  status: ConversationStatus;
  lastActivity: string;
  lastViewed: string;
  lastMessageTime?: string;
  autoResolvedAt?: string;
}

interface StatusCounts {
  unread: number;
  in_progress: number;
  resolved: number;
}

export const useUnifiedConversationStatus = () => {
  const [updating, setUpdating] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ unread: 0, in_progress: 0, resolved: 0 });
  const { toast } = useToast();

  const getStatusKey = (channelId: string, conversationId: string) => 
    `unified_status_${channelId}_${conversationId}`;

  const getConversationStatusData = useCallback((channelId: string, conversationId: string): ConversationStatusData => {
    const statusKey = getStatusKey(channelId, conversationId);
    const savedData = localStorage.getItem(statusKey);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          status: parsed.status || 'unread',
          lastActivity: parsed.lastActivity || new Date().toISOString(),
          lastViewed: parsed.lastViewed || new Date().toISOString(),
          lastMessageTime: parsed.lastMessageTime,
          autoResolvedAt: parsed.autoResolvedAt
        };
      } catch (error) {
        console.error('❌ [UNIFIED_STATUS] Error parsing saved status:', error);
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
    updateStatusCounts();
  }, []);

  const updateStatusCounts = useCallback(() => {
    const counts: StatusCounts = { unread: 0, in_progress: 0, resolved: 0 };
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('unified_status_')) {
        try {
          const statusData = JSON.parse(localStorage.getItem(key) || '{}');
          if (statusData.status) {
            counts[statusData.status]++;
          }
        } catch (error) {
          console.error('❌ [UNIFIED_STATUS] Error counting status:', error);
        }
      }
    });
    
    setStatusCounts(counts);
  }, []);

  // Nova mensagem SEMPRE volta para pendente
  const handleNewMessage = useCallback((channelId: string, conversationId: string, messageTime: string) => {
    console.log(`📩 [UNIFIED_STATUS] Nova mensagem - mudando para pendente: ${channelId}/${conversationId}`);
    
    const currentData = getConversationStatusData(channelId, conversationId);
    
    const updatedData: ConversationStatusData = {
      ...currentData,
      status: 'unread', // SEMPRE pendente para nova mensagem
      lastActivity: messageTime,
      lastMessageTime: messageTime,
      autoResolvedAt: undefined // Remove marcação de auto-resolução
    };
    
    saveConversationStatusData(channelId, conversationId, updatedData);
    return true;
  }, [getConversationStatusData, saveConversationStatusData]);

  // Auto-resolver conversas antigas (24 horas sem atividade)
  useEffect(() => {
    const checkAndAutoResolve = () => {
      console.log('🤖 [UNIFIED_STATUS] Verificando conversas para auto-resolução');
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let resolvedCount = 0;

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('unified_status_')) {
          try {
            const statusData = JSON.parse(localStorage.getItem(key) || '{}');
            
            // Auto-resolver apenas conversas "em andamento" após 24h sem atividade
            if (statusData.status === 'in_progress' && statusData.lastActivity) {
              const lastActivityDate = new Date(statusData.lastActivity);
              if (lastActivityDate < twentyFourHoursAgo) {
                const updatedData = { 
                  ...statusData, 
                  status: 'resolved',
                  autoResolvedAt: now.toISOString()
                };
                localStorage.setItem(key, JSON.stringify(updatedData));
                resolvedCount++;
                console.log(`🤖 [UNIFIED_STATUS] Auto-resolvida: ${key}`);
              }
            }
          } catch (error) {
            console.error('❌ [UNIFIED_STATUS] Erro na auto-resolução:', error);
          }
        }
      });

      if (resolvedCount > 0) {
        console.log(`🤖 [UNIFIED_STATUS] ${resolvedCount} conversas auto-resolvidas`);
        updateStatusCounts();
      }
    };

    // Verificar imediatamente e depois a cada hora
    checkAndAutoResolve();
    const interval = setInterval(checkAndAutoResolve, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [updateStatusCounts]);

  const updateConversationStatus = useCallback(async (
    channelId: string,
    conversationId: string, 
    status: ConversationStatus,
    showToast: boolean = true
  ) => {
    if (!channelId || !conversationId) {
      console.error('❌ [UNIFIED_STATUS] Missing channelId or conversationId');
      return false;
    }
    
    try {
      setUpdating(true);
      console.log(`🔄 [UNIFIED_STATUS] Atualizando conversa ${conversationId} em ${channelId} para ${status}`);
      
      const currentData = getConversationStatusData(channelId, conversationId);
      const updatedData: ConversationStatusData = {
        ...currentData,
        status,
        lastActivity: new Date().toISOString(),
        // Limpar auto-resolução se foi manualmente alterado
        ...(status !== 'resolved' && { autoResolvedAt: undefined })
      };
      
      saveConversationStatusData(channelId, conversationId, updatedData);
      
      // Marcar mensagens como lidas no banco se necessário
      if (status === 'in_progress' || status === 'resolved') {
        try {
          const tableMapping: Record<string, string> = {
            'chat': 'yelena_ai_conversas',
            'canarana': 'canarana_conversas',
            'souto-soares': 'souto_soares_conversas',
            'joao-dourado': 'joao_dourado_conversas',
            'america-dourada': 'america_dourada_conversas',
            'gerente-lojas': 'gerente_lojas_conversas',
            'gerente-externo': 'gerente_externo_conversas'
          };
          
          const tableName = tableMapping[channelId];
          if (tableName) {
            const { error } = await supabase.rpc('mark_messages_as_read', {
              table_name: tableName,
              p_session_id: conversationId
            });
            
            if (error) {
              console.error('❌ [UNIFIED_STATUS] Erro ao marcar mensagens como lidas:', error);
            } else {
              console.log('✅ [UNIFIED_STATUS] Mensagens marcadas como lidas no banco');
            }
          }
        } catch (dbError) {
          console.error('❌ [UNIFIED_STATUS] Erro no banco de dados:', dbError);
        }
      }
      
      if (showToast) {
        const statusMessages = {
          'unread': 'pendente',
          'in_progress': 'em andamento', 
          'resolved': 'resolvida'
        };
        
        toast({
          title: "Status atualizado",
          description: `Conversa marcada como ${statusMessages[status]}`,
        });
      }
      
      console.log('✅ [UNIFIED_STATUS] Status atualizado com sucesso');
      return true;
    } catch (err) {
      console.error('❌ [UNIFIED_STATUS] Erro ao atualizar status da conversa:', err);
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
    console.log(`👁️ [UNIFIED_STATUS] Marcando conversa ${conversationId} como visualizada`);
    const currentData = getConversationStatusData(channelId, conversationId);
    
    // Auto-transição de pendente para em andamento quando visualizada
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
    const globalStats: Record<string, Record<string, ConversationStatusData>> = {};
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('unified_status_')) {
        try {
          const [, , channelId, conversationId] = key.split('_');
          const statusData = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (!globalStats[channelId]) {
            globalStats[channelId] = {};
          }
          
          globalStats[channelId][conversationId] = statusData;
        } catch (error) {
          console.error('❌ [UNIFIED_STATUS] Error parsing stats:', error);
        }
      }
    });
    
    return globalStats;
  }, []);

  // Inicializar contadores
  useEffect(() => {
    updateStatusCounts();
  }, [updateStatusCounts]);

  return {
    updateConversationStatus,
    getConversationStatus,
    markConversationAsViewed,
    handleNewMessage,
    getAllConversationStats,
    statusCounts,
    updating
  };
};

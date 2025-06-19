
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.ts';

export type ConversationStatus = 'unread' | 'in_progress' | 'resolved';

interface ConversationStatusData {
  status: ConversationStatus;
  lastActivity: string;
  lastViewed: string;
  lastMessageTime?: string;
  autoResolvedAt?: string;
}

export const useConversationStatusEnhanced = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

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
          lastViewed: parsed.lastViewed || new Date().toISOString(),
          lastMessageTime: parsed.lastMessageTime,
          autoResolvedAt: parsed.autoResolvedAt
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
    
    // Também salvar em estrutura global para estatísticas
    const globalKey = 'conversation_stats_cache';
    const globalStats = JSON.parse(localStorage.getItem(globalKey) || '{}');
    
    if (!globalStats[channelId]) {
      globalStats[channelId] = {};
    }
    
    globalStats[channelId][conversationId] = data;
    localStorage.setItem(globalKey, JSON.stringify(globalStats));
  }, []);

  // Função para detectar nova mensagem e reativar conversa resolvida
  const handleNewMessage = useCallback((channelId: string, conversationId: string, messageTime: string) => {
    console.log(`📩 [STATUS] Nova mensagem detectada em ${channelId}/${conversationId}`);
    
    const currentData = getConversationStatusData(channelId, conversationId);
    
    // Se estava resolvida, voltar para pendente
    if (currentData.status === 'resolved') {
      console.log(`🔄 [STATUS] Reativando conversa resolvida para pendente`);
      const updatedData: ConversationStatusData = {
        ...currentData,
        status: 'unread',
        lastActivity: messageTime,
        lastMessageTime: messageTime,
        autoResolvedAt: undefined // Remove marcação de auto-resolução
      };
      saveConversationStatusData(channelId, conversationId, updatedData);
      return true; // Indica que houve mudança
    }
    
    // Atualizar timestamp da última mensagem para conversas ativas
    if (currentData.status === 'unread' || currentData.status === 'in_progress') {
      const updatedData: ConversationStatusData = {
        ...currentData,
        lastActivity: messageTime,
        lastMessageTime: messageTime
      };
      saveConversationStatusData(channelId, conversationId, updatedData);
    }
    
    return false;
  }, [getConversationStatusData, saveConversationStatusData]);

  // Auto-resolver conversas antigas (24 horas sem interação)
  useEffect(() => {
    const checkAndAutoResolve = () => {
      console.log('🤖 [STATUS] Verificando conversas para auto-resolução');
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let resolvedCount = 0;

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('conversation_status_')) {
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
                console.log(`🤖 [STATUS] Auto-resolvida: ${key}`);
              }
            }
          } catch (error) {
            console.error('❌ [STATUS] Erro na auto-resolução:', error);
          }
        }
      });

      if (resolvedCount > 0) {
        console.log(`🤖 [STATUS] ${resolvedCount} conversas auto-resolvidas`);
      }
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
      console.log(`🔄 [STATUS] Atualizando conversa ${conversationId} em ${channelId} para ${status}`);
      
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
              console.error('❌ [STATUS] Erro ao marcar mensagens como lidas:', error);
            } else {
              console.log('✅ [STATUS] Mensagens marcadas como lidas no banco');
            }
          }
        } catch (dbError) {
          console.error('❌ [STATUS] Erro no banco de dados:', dbError);
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
      
      console.log('✅ [STATUS] Status atualizado com sucesso');
      return true;
    } catch (err) {
      console.error('❌ [STATUS] Erro ao atualizar status da conversa:', err);
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
    console.log(`👁️ [STATUS] Marcando conversa ${conversationId} como visualizada`);
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
    const globalKey = 'conversation_stats_cache';
    const globalStats = JSON.parse(localStorage.getItem(globalKey) || '{}');
    return globalStats;
  }, []);

  return {
    updateConversationStatus,
    getConversationStatus,
    markConversationAsViewed,
    handleNewMessage,
    getAllConversationStats,
    updating
  };
};

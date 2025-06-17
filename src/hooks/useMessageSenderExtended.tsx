
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RawMessage, FileData } from '@/types/messageTypes';
import { N8nMessagingService } from '@/services/N8nMessagingService';
import { supabase } from '@/integrations/supabase/client';

interface MessagePayload {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'agent';
  agentName?: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  fileData?: FileData;
}

export const useMessageSenderExtended = () => {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (
    payload: MessagePayload,
    addMessageToState?: (message: RawMessage) => void
  ): Promise<boolean> => {
    if (!user) {
      console.error('❌ [MESSAGE_SENDER] Usuário não autenticado');
      return false;
    }

    setSending(true);
    
    try {
      console.log('📤 [MESSAGE_SENDER] Enviando mensagem via webhook universal:', payload);

      // Buscar mapping do canal
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', payload.channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [MESSAGE_SENDER] Mapping não encontrado para canal:', payload.channelId);
        toast({
          title: "Erro",
          description: "Canal não configurado",
          variant: "destructive"
        });
        return false;
      }

      // Preparar dados para o webhook universal
      let result;
      
      if (payload.fileData) {
        // Enviar mídia
        result = await N8nMessagingService.sendMediaMessage(
          mapping.channel_name,
          mapping.instance_name,
          payload.conversationId,
          payload.fileData.base64,
          payload.content,
          payload.messageType as any,
          payload.fileData.fileName
        );
      } else {
        // Enviar texto
        result = await N8nMessagingService.sendTextMessage(
          mapping.channel_name,
          mapping.instance_name,
          payload.conversationId,
          payload.content
        );
      }

      if (result.success) {
        console.log('✅ [MESSAGE_SENDER] Mensagem enviada com sucesso via webhook universal');
        
        // Adicionar mensagem ao estado local (não salvar no Supabase)
        if (addMessageToState) {
          const localMessage: RawMessage = {
            id: `temp_${Date.now()}`,
            content: payload.content,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            conversation_id: payload.conversationId,
            channel_id: payload.channelId,
            agent_name: payload.agentName || user.name,
            message_type: payload.messageType,
            file_data: payload.fileData || null
          };
          
          addMessageToState(localMessage);
        }

        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso",
        });
        
        return true;
      } else {
        console.error('❌ [MESSAGE_SENDER] Erro ao enviar mensagem:', result.error);
        toast({
          title: "Erro",
          description: result.error || "Erro ao enviar mensagem",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('❌ [MESSAGE_SENDER] Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao enviar mensagem",
        variant: "destructive"
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  return { sendMessage, sending };
};

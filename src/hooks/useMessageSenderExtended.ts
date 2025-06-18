
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileData } from '@/types/messageTypes';
import { N8nMessagingService } from '@/services/N8nMessagingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExtendedMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video' | 'document';
  fileData?: FileData;
}

interface LocalMessage {
  id: string;
  content: string;
  sender: 'agent';
  timestamp: string;
  conversationId: string;
  channelId: string;
  agentName: string;
  messageType: string;
  fileData: FileData | null;
  // Add missing properties to match RawMessage interface
  session_id: string;
  message: string;
  tipo_remetente?: string;
  mensagemtype?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  media_base64?: string;
  read_at?: string;
  is_read?: boolean;
}

export const useMessageSenderExtended = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const sendMessage = async (
    messageData: ExtendedMessageData, 
    addMessageToState?: (message: LocalMessage) => void
  ): Promise<boolean> => {
    setSending(true);
    console.log('[useMessageSenderExtended] Início de sendMessage. messageData:', messageData);
    
    try {
      // Extrair número de telefone do conversationId
      let phoneNumber = messageData.conversationId;
      if (phoneNumber.includes("_")) {
        phoneNumber = phoneNumber.split("_")[0];
      }

      // Buscar mapping do canal
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', messageData.channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [MESSAGE_SENDER] Mapping não encontrado para canal:', messageData.channelId);
        toast({
          title: "Erro",
          description: "Canal não configurado para envio",
          variant: "destructive"
        });
        return false;
      }

      let result;

      if (messageData.fileData) {
        // Enviar mídia via webhook universal
        result = await N8nMessagingService.sendMediaMessage(
          mapping.channel_name,
          mapping.instance_name,
          phoneNumber,
          messageData.fileData.base64,
          messageData.content || messageData.fileData.fileName,
          messageData.messageType as any,
          messageData.fileData.fileName
        );
      } else {
        // Enviar texto via webhook universal
        result = await N8nMessagingService.sendTextMessage(
          mapping.channel_name,
          mapping.instance_name,
          phoneNumber,
          messageData.content
        );
      }

      if (result.success) {
        console.log('✅ [MESSAGE_SENDER] Mensagem enviada com sucesso via webhook universal');
        
        // IMPORTANTE: NÃO SALVAR NO SUPABASE - apenas adicionar ao estado local
        if (addMessageToState) {
          const localMessage: LocalMessage = {
            id: `temp_${Date.now()}`,
            content: messageData.content,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            conversationId: messageData.conversationId,
            channelId: messageData.channelId,
            agentName: messageData.agentName || user?.name || 'Agente',
            messageType: messageData.messageType || 'text',
            fileData: messageData.fileData || null,
            // Add required properties for RawMessage compatibility
            session_id: messageData.conversationId,
            message: messageData.content,
            tipo_remetente: 'agent',
            mensagemtype: messageData.messageType || 'text',
            read_at: new Date().toISOString(),
            is_read: true
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
      console.error("❌ [MESSAGE_SENDER] Erro:", error);
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

  return {
    sendMessage,
    sending
  };
};


import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';

export interface MessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video';
  fileBase64?: string;
  fileName?: string;
}

export const useMessageSender = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { sendMessage: sendViaEvolution } = useEvolutionApiSender();

  const sendMessage = async (messageData: MessageData) => {
    setSending(true);
    try {
      console.log('📤 [MESSAGE_SENDER] Enviando mensagem via Evolution API:', {
        channelId: messageData.channelId,
        conversationId: messageData.conversationId,
        messageType: messageData.messageType || 'text'
      });

      // Converter MessageData para EvolutionMessageData
      const evolutionMessageData = {
        conversationId: messageData.conversationId,
        channelId: messageData.channelId,
        content: messageData.content,
        sender: messageData.sender,
        agentName: messageData.agentName,
        messageType: mapMessageType(messageData.messageType),
        fileBase64: messageData.fileBase64,
        fileName: messageData.fileName
      };

      const success = await sendViaEvolution(evolutionMessageData);

      if (success) {
        console.log('✅ [MESSAGE_SENDER] Mensagem enviada com sucesso via Evolution API');
        return true;
      } else {
        throw new Error('Falha ao enviar mensagem via Evolution API');
      }

    } catch (error) {
      console.error('❌ [MESSAGE_SENDER] Erro ao enviar mensagem:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
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

// Mapear tipos de mensagem para o formato Evolution API
function mapMessageType(messageType?: string): 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' {
  switch (messageType) {
    case 'file':
      return 'document';
    case 'audio':
      return 'audio';
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    default:
      return 'text';
  }
}

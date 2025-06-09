
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MessageSenderService } from '@/services/MessageSenderService';
import { FileService } from '@/services/FileService';
import { FileData, RawMessage } from '@/types/messageTypes';

export interface ExtendedMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video';
  fileData?: FileData;
}

export const useMessageSenderExtended = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const messageSenderService = new MessageSenderService();

  const sendMessage = async (
    messageData: ExtendedMessageData, 
    addMessageToState?: (message: RawMessage) => void
  ): Promise<boolean> => {
    setSending(true);
    
    try {
      console.log(`🚀 [USE_MESSAGE_SENDER] Iniciando envio para canal ${messageData.channelId}`);

      // Extrair número de telefone do conversationId
      let phoneNumber = messageData.conversationId;
      
      // Se conversationId contém underscore, extrair a parte antes dele
      if (phoneNumber.includes('_')) {
        phoneNumber = phoneNumber.split('_')[0];
      }

      console.log(`📞 [USE_MESSAGE_SENDER] Número extraído: ${phoneNumber}`);

      let resultMessage: RawMessage;

      if (messageData.fileData) {
        // Envio de mídia
        const fileType = FileService.getFileType(messageData.fileData.mimeType);
        console.log(`📎 [USE_MESSAGE_SENDER] Enviando arquivo ${fileType}:`, messageData.fileData.fileName);

        // Preparar base64 com prefixo se necessário
        let mediaContent = messageData.fileData.base64;
        if (!mediaContent.startsWith('data:')) {
          mediaContent = `data:${messageData.fileData.mimeType};base64,${mediaContent}`;
        }

        resultMessage = await messageSenderService.sendMediaMessage(
          messageData.channelId,
          phoneNumber,
          mediaContent,
          messageData.content || messageData.fileData.fileName,
          fileType as 'image' | 'audio' | 'video' | 'document'
        );
      } else {
        // Envio de texto
        console.log(`💬 [USE_MESSAGE_SENDER] Enviando mensagem de texto`);
        resultMessage = await messageSenderService.sendTextMessage(
          messageData.channelId,
          phoneNumber,
          messageData.content
        );
      }

      // Adicionar mensagem ao estado se callback fornecido
      if (addMessageToState && resultMessage) {
        addMessageToState(resultMessage);
      }

      const messageType = messageData.messageType || 'text';
      const typeMessages = {
        text: 'Mensagem enviada',
        file: 'Arquivo enviado',
        audio: 'Áudio enviado',
        image: 'Imagem enviada',
        video: 'Vídeo enviado'
      };

      toast({
        title: "Sucesso",
        description: typeMessages[messageType] + " com sucesso",
      });

      console.log(`✅ [USE_MESSAGE_SENDER] Mensagem enviada com sucesso`);
      return true;
    } catch (error) {
      console.error('❌ [USE_MESSAGE_SENDER] Erro ao enviar mensagem:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro",
        description: `Erro ao enviar mensagem: ${errorMessage}`,
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

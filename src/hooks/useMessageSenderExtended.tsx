
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MessageSenderService } from '@/services/MessageSenderService';
import { ExtendedMessageData, RawMessage } from '@/types/messageTypes'; // Importar RawMessage

export const useMessageSenderExtended = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const messageSenderService = new MessageSenderService();

  const sendMessage = async (
    messageData: ExtendedMessageData,
    addMessageToState: (message: RawMessage) => void // Adicionar este parâmetro
  ): Promise<boolean> => {
    setSending(true);
    try {
      console.log('🎯 [USE_MESSAGE_SENDER] messageData recebido:', messageData);

      let sentMessage: RawMessage | undefined;

      if (messageData.fileData) {
        // É uma mensagem de mídia
        const dataUrl = `data:${messageData.fileData.mimeType};base64,${messageData.fileData.base64}`;
        console.log('🎯 [USE_MESSAGE_SENDER] Enviando mídia:', { type: messageData.messageType, fileName: messageData.fileData.fileName, dataUrlLength: dataUrl.length });
        sentMessage = await messageSenderService.sendMediaMessage(
          messageData.channelId,
          messageData.conversationId,
          dataUrl,
          messageData.content || '', // caption
          messageData.messageType as 'image' | 'audio' | 'video' | 'document' // Cast para tipos de mídia
        );
      } else {
        // É uma mensagem de texto
        console.log('🎯 [USE_MESSAGE_SENDER] Enviando texto:', messageData.content);
        sentMessage = await messageSenderService.sendTextMessage(
          messageData.channelId,
          messageData.conversationId,
          messageData.content
        );
      }

      if (sentMessage) {
        // Adicionar a mensagem enviada diretamente ao estado do chat
        addMessageToState(sentMessage);
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

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
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



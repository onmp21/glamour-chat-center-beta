import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MessageSenderService } from '@/services/MessageSenderService';
import { FileService } from '@/services/FileService';
import { FileData, RawMessage } from '@/types/messageTypes';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingService'; // Importar

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
  const channelApiMappingService = new ChannelApiMappingService(); // Instanciar

  const sendMessage = async (
    messageData: ExtendedMessageData, 
    addMessageToState?: (message: RawMessage) => void
  ): Promise<boolean> => {
    setSending(true);
    console.log('[useMessageSenderExtended] Início de sendMessage. messageData:', messageData);
    
    try {
      // Extrair número de telefone do conversationId
      let phoneNumber = messageData.conversationId;
      console.log('[useMessageSenderExtended] conversationId original:', messageData.conversationId);
      
      // Se conversationId contém underscore, extrair a parte antes dele
      if (phoneNumber.includes("_")) {
        phoneNumber = phoneNumber.split("_")[0];
        console.log('[useMessageSenderExtended] phoneNumber após extração:', phoneNumber);
      }

      // Converter channelId para UUID antes de usar
      const processedChannelId = channelApiMappingService.getChannelUuid(messageData.channelId); // Usar getChannelUuid
      console.log('[useMessageSenderExtended] channelId processado para UUID:', processedChannelId);

      let resultMessage: RawMessage;

      if (messageData.fileData) {
        console.log('[useMessageSenderExtended] Detectado envio de mídia.');
        // Envio de mídia
        const fileType = FileService.getFileType(messageData.fileData.mimeType);
        console.log('[useMessageSenderExtended] Tipo de arquivo detectado:', fileType);

        // Preparar base64 com prefixo se necessário
        let mediaContent = messageData.fileData.base64;
        if (!mediaContent.startsWith("data:")) {
          mediaContent = `data:${messageData.fileData.mimeType};base64,${mediaContent}`;
          console.log('[useMessageSenderExtended] Adicionado prefixo data: ao base64.');
        }
        console.log('[useMessageSenderExtended] Conteúdo da mídia (base64, primeiros 50 chars):', mediaContent.substring(0, 50) + '...');

        resultMessage = await messageSenderService.sendMediaMessage(
          processedChannelId, // Usar o channelId processado
          phoneNumber,
          mediaContent,
          messageData.content || messageData.fileData.fileName,
          fileType as "image" | "audio" | "video" | "document"
        );
        console.log('[useMessageSenderExtended] Resultado de sendMediaMessage:', resultMessage);
      } else {
        console.log('[useMessageSenderExtended] Detectado envio de texto.');
        // Envio de texto
        resultMessage = await messageSenderService.sendTextMessage(
          processedChannelId, // Usar o channelId processado
          phoneNumber,
          messageData.content
        );
        console.log('[useMessageSenderExtended] Resultado de sendTextMessage:', resultMessage);
      }

      // Adicionar mensagem ao estado se callback fornecido
      if (addMessageToState && resultMessage) {
        addMessageToState(resultMessage);
        console.log('[useMessageSenderExtended] Mensagem adicionada ao estado.');
      }

      const messageType = messageData.messageType || "text";
      const typeMessages: Record<string, string> = {
        text: "Mensagem enviada",
        file: "Arquivo enviado",
        audio: "Áudio enviado",
        image: "Imagem enviada",
        video: "Vídeo enviado"
      };

      toast({
        title: "Sucesso",
        description: typeMessages[messageType] + " com sucesso",
      });
      console.log('[useMessageSenderExtended] Toast de sucesso exibido.');

      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      if (error instanceof Error) {
        console.error("Detalhes do erro:", error.message);
        console.error("Pilha de chamadas (stack):", error.stack);
      } else {
        console.error("Erro desconhecido:", error);
      }
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
      console.log('[useMessageSenderExtended] Toast de erro exibido.');
      return false;
    } finally {
      setSending(false);
      console.log('[useMessageSenderExtended] Finalizando sendMessage. setSending(false).');
    }
  };

  return {
    sendMessage,
    sending
  };
};



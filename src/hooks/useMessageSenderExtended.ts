
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MessageSenderService } from '@/services/MessageSenderService';
import { FileService } from '@/services/FileService';
import { FileData, RawMessage } from '@/types/messageTypes';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingServiceRefactored';
import { getContactDisplayName } from "@/utils/getContactDisplayName";

export interface ExtendedMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video' | 'document';
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
    console.log('[useMessageSenderExtended] Início de sendMessage. messageData:', messageData);
    try {
      let phoneNumber = messageData.conversationId;
      if (phoneNumber.includes("_")) {
        phoneNumber = phoneNumber.split("_")[0];
      }
      const processedChannelId = await ChannelApiMappingService.getChannelUuid(messageData.channelId);

      let resultMessage: RawMessage;

      const senderType = messageData.sender;
      const contactNameRefined = getContactDisplayName({
        sender: senderType,
        contactName: messageData.agentName
      });

      if (messageData.fileData) {
        const fileType = FileService.getFileType(messageData.fileData.mimeType);
        let mediaContent = messageData.fileData.base64;
        // Garantir prefixo 'data:' sempre
        if (!mediaContent.startsWith("data:")) {
          mediaContent = `data:${messageData.fileData.mimeType};base64,${mediaContent}`;
        }
        resultMessage = await messageSenderService.sendMediaMessage(
          processedChannelId || messageData.channelId,
          phoneNumber,
          mediaContent,
          messageData.content || messageData.fileData.fileName,
          fileType as "image" | "audio" | "video" | "document",
          senderType,
          messageData.agentName
        );
      } else {
        resultMessage = await messageSenderService.sendTextMessage(
          processedChannelId || messageData.channelId,
          phoneNumber,
          messageData.content,
          senderType,
          messageData.agentName
        );
      }

      if (addMessageToState && resultMessage) {
        addMessageToState(resultMessage);
      }
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

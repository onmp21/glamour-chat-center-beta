
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MessageSenderService } from '@/services/MessageSenderService';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingService';

export const useMessageSenderEnhanced = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const messageSenderService = new MessageSenderService();

  const sendMessage = async (channelId: string, phoneNumber: string, message: string) => {
    setSending(true);
    try {
      // Usar método estático
      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error("API instance not found for channel");
      }

      const result = await messageSenderService.sendTextMessage(
        channelId,
        phoneNumber,
        message
      );

      if (result) {
        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso",
        });
        return result;
      } else {
        throw new Error("Falha ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
      return null;
    } finally {
      setSending(false);
    }
  };

  const sendMediaMessage = async (
    channelId: string, 
    phoneNumber: string, 
    mediaContent: string, 
    caption?: string,
    mediaType: "image" | "audio" | "video" | "document" = "image"
  ) => {
    setSending(true);
    try {
      // Usar método estático
      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error("API instance not found for channel");
      }

      const result = await messageSenderService.sendMediaMessage(
        channelId,
        phoneNumber,
        mediaContent,
        caption || "",
        mediaType
      );

      if (result) {
        toast({
          title: "Sucesso",
          description: "Mídia enviada com sucesso",
        });
        return result;
      } else {
        throw new Error("Falha ao enviar mídia");
      }
    } catch (error) {
      console.error("Erro ao enviar mídia:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mídia",
        variant: "destructive"
      });
      return null;
    } finally {
      setSending(false);
    }
  };

  return {
    sendMessage,
    sendMediaMessage,
    sending
  };
};

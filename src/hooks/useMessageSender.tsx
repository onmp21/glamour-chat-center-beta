
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingService';

export const useMessageSender = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (channelId: string, phoneNumber: string, message: string) => {
    setSending(true);
    try {
      // Usar método estático
      const success = await ChannelApiMappingService.sendMessageViaEvolution(
        channelId,
        phoneNumber,
        message
      );

      if (success) {
        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso",
        });
        return true;
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
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendMediaMessage = async (
    channelId: string, 
    phoneNumber: string, 
    mediaContent: string, 
    caption?: string
  ) => {
    setSending(true);
    try {
      // Para mensagens de mídia, usar método estático
      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
      if (!apiInstance) {
        throw new Error("No API instance found for channel");
      }

      const success = await ChannelApiMappingService.sendMessageViaEvolution(
        channelId,
        phoneNumber,
        caption || "",
        mediaContent
      );

      if (success) {
        toast({
          title: "Sucesso",
          description: "Mídia enviada com sucesso",
        });
        return true;
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
      return false;
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

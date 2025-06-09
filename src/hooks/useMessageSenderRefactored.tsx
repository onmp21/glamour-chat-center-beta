
import { useState } from 'react';
import { MessageSenderService } from '@/services/MessageSenderService';
import { useToast } from '@/hooks/use-toast';
import { RawMessage } from '@/types/messages';

export const useMessageSenderRefactored = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messageSenderService = new MessageSenderService();

  const sendMessage = async (
    channelId: string,
    content: string,
    sessionId: string,
    addMessageToState: (message: RawMessage) => void
  ) => {
    setIsLoading(true);
    try {
      const sentMessage = await messageSenderService.sendTextMessage(channelId, sessionId, content);
      
      if (sentMessage) {
        // Adicionar a mensagem enviada diretamente ao estado do chat
        addMessageToState(sentMessage);

        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso",
        });
        return { success: true };
      } else {
        throw new Error('Falha no envio da mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading
  };
};

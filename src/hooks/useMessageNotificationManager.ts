
import { useEffect, useRef } from 'react';
import { useNotificationSound } from './useNotificationSound';

interface MessageNotificationManagerProps {
  messages: any[];
  isOverlayOpen: boolean;
  enabled?: boolean;
}

export const useMessageNotificationManager = ({
  messages,
  isOverlayOpen,
  enabled = true
}: MessageNotificationManagerProps) => {
  const { playNotificationSound } = useNotificationSound();
  const previousMessagesCountRef = useRef<number>(0);
  const lastExternalMessageIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Só processar se o overlay estiver aberto e notificações estiverem habilitadas
    if (!isOverlayOpen || !enabled || !messages || messages.length === 0) {
      // Inicializar contadores sem tocar som
      previousMessagesCountRef.current = messages?.length || 0;
      return;
    }

    // Na primeira inicialização, apenas definir os valores sem tocar som
    if (!isInitializedRef.current) {
      previousMessagesCountRef.current = messages.length;
      isInitializedRef.current = true;
      console.log('🔔 [MESSAGE_NOTIFICATION] Initialized with', messages.length, 'messages');
      return;
    }

    // Verificar se há novas mensagens
    const currentMessageCount = messages.length;
    const previousMessageCount = previousMessagesCountRef.current;

    if (currentMessageCount > previousMessageCount) {
      // Há novas mensagens - verificar se alguma é de usuário externo
      const newMessages = messages.slice(previousMessageCount);
      
      for (const message of newMessages) {
        const isExternalMessage = message.sender === 'customer' || 
          (message.tipo_remetente && 
           message.tipo_remetente !== 'USUARIO_INTERNO' && 
           message.tipo_remetente !== 'Yelena-ai' &&
           message.tipo_remetente !== 'Andressa-ai');

        // Se é uma mensagem externa e é diferente da última processada
        if (isExternalMessage && message.id !== lastExternalMessageIdRef.current) {
          console.log('🔔 [MESSAGE_NOTIFICATION] Nova mensagem externa detectada:', {
            id: message.id,
            sender: message.sender,
            tipo_remetente: message.tipo_remetente,
            content: message.content?.substring(0, 50) || message.message?.substring(0, 50)
          });

          playNotificationSound();
          lastExternalMessageIdRef.current = message.id;
          break; // Tocar som apenas uma vez por lote de mensagens
        }
      }
    }

    previousMessagesCountRef.current = currentMessageCount;
  }, [messages, isOverlayOpen, enabled, playNotificationSound]);

  return {
    // Função para resetar o estado (útil quando trocar de conversa)
    resetNotificationState: () => {
      previousMessagesCountRef.current = messages?.length || 0;
      lastExternalMessageIdRef.current = null;
      isInitializedRef.current = false;
      console.log('🔄 [MESSAGE_NOTIFICATION] State reset');
    }
  };
};

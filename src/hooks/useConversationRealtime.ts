
import { useEffect, useRef, useState } from 'react';
import { ChannelService } from '@/services/ChannelService';
import { parseMessageData } from '@/utils/messageParser';

interface UseConversationRealtimeProps {
  channelId?: string;
  onNewMessage: () => Promise<void>;
}

export const useConversationRealtime = ({ channelId, onNewMessage }: UseConversationRealtimeProps) => {
  const lastCheckedTimestampRef = useRef<string>(new Date().toISOString());
  const [isPolling, setIsPolling] = useState(false);
  const shouldContinuePollingRef = useRef<boolean>(true);

  useEffect(() => {
    if (!channelId) return;

    console.log(`🚀 [LONG_POLLING] Iniciando long polling para mensagens do canal: ${channelId}`);
    
    shouldContinuePollingRef.current = true;

    // Função para verificar novas mensagens com long polling
    const checkForNewMessages = async () => {
      if (isPolling || !shouldContinuePollingRef.current) return;
      
      try {
        setIsPolling(true);
        
        const channelService = new ChannelService(channelId);
        const { data, error } = await channelService.getNewMessagesAfterTimestamp(lastCheckedTimestampRef.current);
        
        if (error) {
          console.error(`❌ [LONG_POLLING] Erro ao verificar novas mensagens:`, error);
          // Em caso de erro, tentar novamente após um intervalo maior
          setTimeout(() => {
            if (shouldContinuePollingRef.current) checkForNewMessages();
          }, 3000);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`✅ [LONG_POLLING] ${data.length} novas mensagens encontradas para ${channelId}`);
          lastCheckedTimestampRef.current = new Date().toISOString();
          await onNewMessage();
          
          // Se encontrou mensagens, verificar novamente quase imediatamente
          setTimeout(() => {
            if (shouldContinuePollingRef.current) checkForNewMessages();
          }, 500);
        } else {
          // Se não encontrou mensagens, aguardar um pouco mais antes de verificar novamente
          setTimeout(() => {
            if (shouldContinuePollingRef.current) checkForNewMessages();
          }, 2000);
        }
      } catch (error) {
        console.error(`❌ [LONG_POLLING] Erro no polling:`, error);
        // Em caso de erro, tentar novamente após um intervalo maior
        setTimeout(() => {
          if (shouldContinuePollingRef.current) checkForNewMessages();
        }, 3000);
      } finally {
        setIsPolling(false);
      }
    };

    // Iniciar o long polling imediatamente
    checkForNewMessages();

    return () => {
      console.log(`🔴 [LONG_POLLING] Parando long polling para canal: ${channelId}`);
      shouldContinuePollingRef.current = false;
    };
  }, [channelId, onNewMessage, isPolling]);
};

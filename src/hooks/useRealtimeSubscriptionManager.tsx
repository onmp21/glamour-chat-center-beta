import { useEffect } from 'react';
import { MessageService } from '@/services/MessageService';

/**
 * Hook para gerenciar subscrições de tempo real de forma segura
 * Evita múltiplas subscrições e garante limpeza adequada
 */
export const useRealtimeSubscriptionManager = () => {
  useEffect(() => {
    // Cleanup function para limpar todas as subscrições quando o componente for desmontado
    return () => {
      console.log('🧹 [REALTIME_MANAGER] Cleaning up all subscriptions on unmount');
      MessageService.unsubscribeAll();
    };
  }, []);

  // Função para criar subscrição de forma segura
  const createSafeSubscription = (
    channelId: string,
    callback: (payload: any) => void,
    channelSuffix: string = ''
  ) => {
    try {
      const messageService = new MessageService(channelId);
      return messageService.createRealtimeSubscription(callback, channelSuffix);
    } catch (error) {
      console.error('❌ [REALTIME_MANAGER] Error creating subscription:', error);
      return null;
    }
  };

  // Função para limpar subscrição específica
  const cleanupSubscription = (channelSuffix: string, tableName: string) => {
    try {
      MessageService.unsubscribeChannel(channelSuffix, tableName);
    } catch (error) {
      console.error('❌ [REALTIME_MANAGER] Error cleaning up subscription:', error);
    }
  };

  // Função para limpar todas as subscrições
  const cleanupAllSubscriptions = () => {
    try {
      MessageService.unsubscribeAll();
    } catch (error) {
      console.error('❌ [REALTIME_MANAGER] Error cleaning up all subscriptions:', error);
    }
  };

  return {
    createSafeSubscription,
    cleanupSubscription,
    cleanupAllSubscriptions
  };
};


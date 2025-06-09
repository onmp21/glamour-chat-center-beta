
import { useEffect } from 'react';
import { channelWebSocketManager } from '@/services/ChannelWebSocketManager';

export const useWebSocketInitializer = () => {
  useEffect(() => {
    const initializeWebSockets = async () => {
      try {
        console.log('🚀 [WS_INITIALIZER] Inicializando WebSockets da aplicação');
        await channelWebSocketManager.loadExistingMappings();
        console.log('✅ [WS_INITIALIZER] WebSockets inicializados com sucesso');
      } catch (error) {
        console.error('❌ [WS_INITIALIZER] Erro ao inicializar WebSockets:', error);
      }
    };

    initializeWebSockets();
  }, []);
};

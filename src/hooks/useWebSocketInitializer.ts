
import { useEffect } from 'react';

// Este hook foi modificado para remover todas as dependências de WebSocket
// Agora usamos long polling em vez de WebSocket para maior confiabilidade
export const useWebSocketInitializer = () => {
  useEffect(() => {
    const initializePolling = async () => {
      try {
        console.log('🚀 [POLLING_INITIALIZER] Inicializando sistema de polling');
        // Não faz nada - o polling é inicializado nos componentes individuais
        console.log('✅ [POLLING_INITIALIZER] Sistema de polling inicializado');
      } catch (error) {
        console.error('❌ [POLLING_INITIALIZER] Erro ao inicializar polling:', error);
      }
    };

    initializePolling();
  }, []);
};

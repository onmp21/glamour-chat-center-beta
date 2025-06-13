
import { useEffect } from 'react';

// Este hook foi desabilitado - não usa mais WebSocket
// O sistema agora funciona apenas com polling direto ao Supabase
export const useWebSocketInitializer = () => {
  useEffect(() => {
    console.log('🚀 [POLLING_INITIALIZER] Sistema simplificado sem WebSocket');
    // Não faz nada - removido completamente o WebSocket
  }, []);
};

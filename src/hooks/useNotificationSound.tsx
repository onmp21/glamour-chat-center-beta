import { useRef } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Função vazia que não reproduz nenhum som
  const playNotificationSound = () => {
    // Som removido conforme solicitado
    console.log('Som de notificação desativado');
  };

  return { playNotificationSound };
};


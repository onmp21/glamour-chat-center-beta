
import { useEffect, useRef } from 'react';

interface NotificationSoundProps {
  enabled?: boolean;
  soundUrl?: string;
}

export const useNotificationSound = ({ 
  enabled = false, // Desabilitado por padrão conforme solicitado
  soundUrl = '/sounds/notification-alert-269289.mp3' 
}: NotificationSoundProps = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayTimeRef = useRef<number>(0);
  const MIN_PLAY_INTERVAL = 1000; // Mínimo de 1 segundo entre reproduções

  useEffect(() => {
    if (enabled) {
      // Criar elemento de áudio
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7; // Volume moderado
      
      console.log('🔊 [NOTIFICATION_SOUND] Audio element created:', soundUrl);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [enabled, soundUrl]);

  const playNotificationSound = () => {
    if (!enabled || !audioRef.current) {
      console.log('🔊 [NOTIFICATION_SOUND] Sound disabled or no audio element');
      return;
    }

    const now = Date.now();
    if (now - lastPlayTimeRef.current < MIN_PLAY_INTERVAL) {
      console.log('🔊 [NOTIFICATION_SOUND] Skipping sound - too soon after last play');
      return;
    }

    try {
      // Reset audio to beginning
      audioRef.current.currentTime = 0;
      
      // Play sound
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 [NOTIFICATION_SOUND] Sound played successfully');
            lastPlayTimeRef.current = now;
          })
          .catch((error) => {
            console.warn('🔊 [NOTIFICATION_SOUND] Failed to play sound:', error);
          });
      }
    } catch (error) {
      console.warn('🔊 [NOTIFICATION_SOUND] Error playing sound:', error);
    }
  };

  return { playNotificationSound };
};

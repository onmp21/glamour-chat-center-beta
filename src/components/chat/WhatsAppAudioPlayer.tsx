
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';

interface WhatsAppAudioPlayerProps {
  audioUrl: string;
  isDarkMode?: boolean;
  balloonColor?: 'sent' | 'received';
  onError?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  audioUrl,
  isDarkMode = false,
  balloonColor = 'received',
  onError,
  onDownload,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();

  // Função para atualização fluida do progresso
  const updateProgress = () => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      setCurrentTime(audio.currentTime || 0);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      updateProgress();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleError = () => {
      console.error('❌ [WHATSAPP_AUDIO_PLAYER] Audio load error:', audioUrl);
      if (onError) onError();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl, onError, isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? currentTime / duration * 100 : 0;

  // Definir cores baseado no balloonColor e isDarkMode
  const getColors = () => {
    if (balloonColor === 'sent') {
      return {
        buttonBg: 'rgba(255, 255, 255, 0.2)',
        progressBg: 'rgba(255, 255, 255, 0.2)',
        progressFill: 'rgba(255, 255, 255, 0.8)',
        waveColor: 'rgba(255, 255, 255, 0.4)'
      };
    } else {
      if (isDarkMode) {
        return {
          buttonBg: 'rgba(255, 255, 255, 0.1)',
          progressBg: 'rgba(255, 255, 255, 0.1)',
          progressFill: 'rgba(255, 255, 255, 0.7)',
          waveColor: 'rgba(255, 255, 255, 0.3)'
        };
      } else {
        return {
          buttonBg: 'rgba(0, 0, 0, 0.05)',
          progressBg: 'rgba(0, 0, 0, 0.1)',
          progressFill: '#b5103c',
          waveColor: 'rgba(0, 0, 0, 0.2)'
        };
      }
    }
  };

  const colors = getColors();

  return (
    <div className={cn("flex items-center space-x-2 p-2 rounded-lg min-w-[180px] max-w-[240px]", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Botão Play/Pause mais compacto */}
      <button
        onClick={togglePlayPause}
        disabled={!isLoaded}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0",
          !isLoaded && "opacity-50 cursor-not-allowed"
        )}
        style={{ backgroundColor: colors.buttonBg }}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3 ml-0.5" />
        )}
      </button>

      {/* Waveform visual compacto */}
      <div className="flex-1 min-w-0 space-y-1">
        <div 
          className="relative h-4 rounded-full cursor-pointer overflow-hidden"
          style={{ backgroundColor: colors.progressBg }}
          onClick={handleProgressClick}
        >
          {/* Barra de progresso com transição mais suave */}
          <div 
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: colors.progressFill,
              transition: isPlaying ? 'none' : 'width 0.1s ease-out'
            }}
          />
          
          {/* Padrão de ondas simplificado */}
          <div className="absolute inset-0 flex items-center justify-center space-x-0.5 pointer-events-none px-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full opacity-40"
                style={{
                  height: `${Math.random() * 8 + 4}px`,
                  backgroundColor: colors.waveColor
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Mostrar apenas duração total */}
        <div className="flex justify-end text-xs opacity-60 leading-none">
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaProcessorUnified } from '@/utils/MediaProcessorUnified';

interface AudioPlayerFixedProps {
  audioContent: string;
  isDarkMode?: boolean;
  messageId: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export const AudioPlayerFixed: React.FC<AudioPlayerFixedProps> = ({
  audioContent,
  isDarkMode = false,
  messageId,
  onLoadStart,
  onLoadEnd,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Processar áudio na inicialização
  useEffect(() => {
    console.log('🎵 [AUDIO_FIXED] Processing audio for message:', messageId);
    
    const result = MediaProcessorUnified.process(audioContent, 'audio');
    
    if (result.success && result.dataUrl) {
      console.log('✅ [AUDIO_FIXED] Audio processed successfully:', {
        messageId,
        mimeType: result.mimeType,
        size: result.size
      });
      setAudioUrl(result.dataUrl);
      setHasError(false);
    } else {
      console.error('❌ [AUDIO_FIXED] Failed to process audio:', result.error);
      setHasError(true);
      onError?.();
    }
  }, [audioContent, messageId, onError]);

  // Configurar eventos do áudio quando URL estiver disponível
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    let loadTimeout: NodeJS.Timeout;

    const handleLoadStart = () => {
      console.log('🎵 [AUDIO_FIXED] Load start:', messageId);
      onLoadStart?.();
    };

    const handleLoadedMetadata = () => {
      console.log('🎵 [AUDIO_FIXED] Metadata loaded:', messageId, 'duration:', audio.duration);
      
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
        onLoadEnd?.();
        clearTimeout(loadTimeout);
      }
    };

    const handleCanPlay = () => {
      console.log('🎵 [AUDIO_FIXED] Can play:', messageId);
      if (!isLoaded && audio.duration) {
        setDuration(audio.duration);
        setIsLoaded(true);
        onLoadEnd?.();
        clearTimeout(loadTimeout);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) {
        audio.currentTime = 0;
      }
    };

    const handleError = (e: Event) => {
      console.error('❌ [AUDIO_FIXED] Error loading audio:', messageId, e);
      setIsLoaded(false);
      setHasError(true);
      onError?.();
      clearTimeout(loadTimeout);
    };

    // Timeout para evitar loading infinito
    loadTimeout = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn('⚠️ [AUDIO_FIXED] Load timeout:', messageId);
        setHasError(true);
        onError?.();
      }
    }, 8000); // 8 segundos

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Tentar carregar
    audio.load();

    return () => {
      clearTimeout(loadTimeout);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, messageId, isLoaded, hasError, onLoadStart, onLoadEnd, onError]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('❌ [AUDIO_FIXED] Play error:', error);
            setHasError(true);
          });
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  // Estado de erro
  if (hasError) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg max-w-[280px]",
        isDarkMode ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
      )}>
        <AlertCircle className="text-red-500" size={20} />
        <span className={cn(
          "text-sm",
          isDarkMode ? "text-red-300" : "text-red-600"
        )}>
          Erro ao carregar áudio
        </span>
      </div>
    );
  }

  // Estado de carregamento
  if (!isLoaded && !hasError) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg max-w-[280px]",
        isDarkMode ? "bg-gray-700" : "bg-gray-100"
      )}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        <span className={cn(
          "text-sm",
          isDarkMode ? "text-gray-300" : "text-gray-600"
        )}>
          Carregando áudio...
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "chat-message-audio p-3 rounded-lg max-w-[280px]",
      isDarkMode ? "bg-gray-800" : "bg-gray-100"
    )}>
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={!isLoaded || hasError}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            "bg-blue-500 text-white hover:bg-blue-600",
            (!isLoaded || hasError) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-1" />
          )}
        </button>

        {/* Waveform e Info */}
        <div className="flex-1 min-w-0">
          {/* Barra de progresso simples */}
          <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Tempo */}
          <div className={cn(
            "text-xs font-mono text-right",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
};
